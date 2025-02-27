async function getData() {
    //Fetcha dataið, parsar það og skilar því svo
    const url = "hatidir.json";
    const response = await fetch(url); //fetcha dataið
    return await response.json(); //parsa jsonið og skila því
}

//set upp global location variable, default er reykjavík
let userLat = 64.146667;
let userLon = -21.94;

function calcDistance(lat2, lon2) {
    //Reikna fjarlægðina á milli stað og reykjavíkur
    //user coordinates, default er reykjavík:
    lat1 = userLat;
    lon1 = userLon;
    //nota formúlu sem ég fann hér: https://www.movable-type.co.uk/scripts/latlong.html
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // in metres
    return d //skila svo fjarlæginni
}

function fragmentMaker(data) {
    //Bý til elementin
    //sorta dataið eftir fjarlægð frá reykjavík með sort functionini
    data.sort((a, b) => {
        return calcDistance(a.location.latitude, a.location.longitude) - calcDistance(b.location.latitude, b.location.longitude);
      });
    // bý til fragment sem er eins og array nema betra
    const fragment = document.createDocumentFragment(); 
    //fer í gegnum öll objectin úr jsoninu
    data.forEach(({name, description, events, imageUrl, date, location, url}) => {
        //Bý til cardið og content divið sem heldur allar upplýsingarnar
        const card = document.createElement('div');
        card.classList.add('card');
        const contentDiv = document.createElement('div');
        contentDiv.id = "content";

        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = name;
        image.onerror = () => {
            image.src = "https://assets.simpleviewinc.com/simpleview/image/upload/c_fill,f_jpg,h_767,q_65,w_639/v1/clients/fortcollinsco/Events_old_town_concert_credit_Richard_Haro_cc9500d5-7f6d-4786-9735-4a9d75d8fa50.jpg";
        };
        const dateid = document.createElement('p');
        //breyti dagsetningunni í íslenska dagsetningu
        dateid.textContent = dayjs(date, 'YYYY/MM/DD').locale('is').format('D. MMMM YYYY');
        dateid.classList.add('litid');

        const title = document.createElement('h2');
        title.textContent = name;
        const locationid = document.createElement('p');
        locationid.textContent = location.city;
        locationid.classList.add('litid');

        const desc = document.createElement('p');
        desc.textContent = description;

        const eventin = document.createElement('p');
        eventin.textContent =`Tags: ${events.join(', ')}`;
        eventin.classList.add('litid');

        const link = document.createElement('a');
        link.href = url;        
        link.textContent = "Meira um viðburðinn";
        link.target = "_blank";
        link.rel = "noopener noreferrer"

        //Bæti við öllum items við #content divið
        contentDiv.appendChild(image);
        contentDiv.appendChild(dateid);
        contentDiv.appendChild(title);
        contentDiv.appendChild(locationid);
        contentDiv.appendChild(link);
        contentDiv.appendChild(desc); 
        contentDiv.appendChild(eventin);

        //Bæti svo #content divinu við cardið og bæti svo cardinu við fragmentið
        card.appendChild(contentDiv);
        fragment.appendChild(card);
    });
    return fragment;
}

function render(fragment) {
    //Birti fragmentið
    const contentContainer = document.querySelector("main");
    contentContainer.replaceChildren(fragment);

    //stilli upp tilt        
    VanillaTilt.init(document.querySelectorAll(".card"), {
        scale: 1.01,
        perspective: 1000,
        max: 3,
        speed: 5000,
        glare: true,
        "max-glare": 0.3,
      }); 
}

let data = [];
//initializa date breyturnar þannig það virki í scopeinu
let startDate;
let endDate;
//Nota IIFE fall til þess að geta notað async/await, það er ekki hægt að nota það í top level kóða
document.addEventListener("DOMContentLoaded", async () => {
    (async () => { 
        //Starta loaderinum 
        const loaderBar = document.getElementById("loader-bar");
        let progress = 0;
        //function sem á 70 ms fresti bæti ég 10% við loaderinn með því að nota nested loops
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90) { //stoppar á 90%
                loaderBar.style.width = progress + "%";
            } else {
                clearInterval(progressInterval);
            }
        }, 70);

        //Simulate a delay, til að prófa loading skilaboðin og hafa kannski kúl animation til að birta allt
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        await delay(1100);

        try {
            //fetcha, bý til fragment, svo rendera ég það
            data = await getData(); 
            fragment = fragmentMaker(data);
            render(fragment);
            //nota geolocation api til að fá user location áður en ég birti síðuna
            navigator.geolocation.getCurrentPosition((e) => {
                userLat = e.coords.latitude;
                userLon = e.coords.longitude;
            });
            //filli upp loaderinn
            loaderBar.style.width = "100%";

            //Bý til calendarinn
            //Bý til iterable með öllum dagsetningunum til að finna min og max date
            const dates = data.map(item => new Date(item.date));
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));

            startDate = minDate;
            endDate = maxDate;
            flatpickr(".calendar", {
                altInput: true,
                altFormat: "M j",
                dateFormat: "Y-m-d",
                wrap: true,
                minDate: minDate,
                maxDate: maxDate,
                mode: "range",
                //loada íslensku en hef range separatorinn sem -
                locale: {
                    ...flatpickr.l10ns.is, 
                    rangeSeparator: " - "
                },
                onChange: function(dates) {
                    //Ef að það range er selected þá filtera ég
                    if (dates.length === 2) {
                        startDate = dates[0];
                        endDate = dates[1];
                    //ef að það er selectað minna en eitt þá cleara ég date breyturnar
                    } else {
                        startDate = null;
                        endDate = null;
                    }
                    filters();
                }
            });

            //Bý til kortið, markers, og nota svo openstreetmap
            let map = L.map('map').setView([userLat, userLon], 13);
            //bý til cluster group til að hafa allt
            const markers = L.markerClusterGroup();
            //fer í gegnum items og birti location ásamt nafninu og bæti við cluster
            data.forEach(item => {
                const marker = L.marker([item.location.latitude, item.location.longitude], { title: item.name });
                marker.bindTooltip(item.name, { direction: 'top'});
                markers.addLayer(marker);
            });
            //bæti við openstreetmap
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);
            //bæti við markersnum
            map.addLayer(markers);


        } catch (err) {
            //ef error birti það í error tagginu og bæti við hiddenerr klasan til þess að hava flott style
            let errorid = document.createElement('h2');
            errorid.id = "errors";
            errorid.textContent = err.message;
            document.querySelector("main").replaceChildren(errorid);
            console.log(err);
        } finally {
            //Þegar allt er búið að loadast þá fadea út loaderinn
            document.getElementById("overlay").classList.add("hidden");
        }
    })();

    //filter functionið
    function filters() {
        function filteredData(item) {
            //filterar eftir searchi og distance, 
            const filter1 = item.name.toLowerCase().includes(searchid.toLowerCase());
            const lengd = calcDistance(item.location.latitude, item.location.longitude);
            const filter2 = lengd >= low && lengd <= high;
            const dagur = new Date(item.date);
            //filterar eftir dagsetningu !xDate er fyrir ef að það er null eða undefined
            const filter3 = (!startDate || dagur >= startDate) && (!endDate || dagur <= endDate)
            //skilar bara ef að það er true í öllum filterunum
            return filter1 && filter2 && filter3;
        };
        //kalla á filter fallið, bý til fragment og rendera það
        filtered = data.filter(filteredData);
        if (data.filter(filteredData).length === 0) {
            let errorid = document.createElement('h2');
            errorid.id = "errors";
            errorid.textContent = "Ekkert Fannst!";
            document.querySelector("main").replaceChildren(errorid);
        } else {
            const fragment = fragmentMaker(filtered);
            render(fragment);
        };
    }

    //search function með debounce
    let searchid = "";
    let debounceTimeout;
    document.getElementById("searchFestivals").addEventListener("input", function(event) {
        //resetta timerinn þannig ef að það er skrifað annan staf þá byrjar hann aftur
        clearTimeout(debounceTimeout);
        //starta timerinn
        debounceTimeout = setTimeout(() => {
            //ef að 200ms liðnar síðan að það var skrifað þá filtera ég
            searchid = event.target.value;
            filters();
        }, 200);
    });

    //filter takkinn, sýnir menu-ið
    document.getElementById('filters').addEventListener('click', function(event) {
        event.stopPropagation();
        document.querySelector('.popup').classList.toggle('show');
        document.getElementById('filters').classList.toggle('focused');
    });
    //Ef að það er ýtt á eitthvað í popupinu þá lokast það ekki
    document.querySelector('.popup').addEventListener('click', function(event) {
        event.stopPropagation();
    });
    document.addEventListener('click', function() {
        document.querySelector('.popup').classList.remove('show');
        document.getElementById('filters').classList.remove('focused');
    });

    //Bý til sliderinn
    slider = document.getElementById('slider');
    noUiSlider.create(slider, {
        start: [0, 500],
        connect: true,
        step: 10,
        range: {
            'min': 0,
            'max': 500
        }
    });

    //Slider sem filterar eftir fjarlægð
    let low = 0;
    let high = 5000;
    let debounceTimeout2;
    slider.noUiSlider.on("update", function(event) {
        document.getElementById('slider-info').textContent =`${Number(event[0])} - ${Number(event[1])} km`;
        //resetta timerinn þannig ef að það er hreyft þá byrjar hann aftur
        clearTimeout(debounceTimeout2);
        //starta timerinn
        debounceTimeout2 = setTimeout(() => {
            //ef að 200ms liðnar síðan að það var interactað þá filtera ég
            low = event[0] * 1000;
            high = event[1] * 1000;
            filters();
        }, 200);
    });
});