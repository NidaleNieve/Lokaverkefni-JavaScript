async function getData() {
    //Fetcha dataið, parsar það og skilar því svo
    const url = "info.json";
    const response = await fetch(url); //fetcha dataið
    return await response.json(); //parsa jsonið og skila því
}

function fragmentMaker(data) {
    //Bý til elementin
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

        const title = document.createElement('h2');
        title.textContent = name;

        const desc = document.createElement('p');
        desc.textContent = description;

        const dateid = document.createElement('p');
        //breyti dagsetningunni í íslenska dagsetningu
        dateid.textContent = dayjs(date, 'YYYY/MM/DD').locale('is').format('D. MMMM YYYY');

        const eventin = document.createElement('p');
        eventin.textContent =`Tags: ${events.join(', ')}`;

        const locationid = document.createElement('p');
        locationid.textContent = location.city;

        const link = document.createElement('a');
        link.href = url;        
        link.textContent = "Meira um viðburðinn";
        link.target = "_blank";
        link.rel = "noopener noreferrer"

        //Bæti við öllum items við #content divið
        contentDiv.appendChild(image);
        contentDiv.appendChild(title);
        contentDiv.appendChild(desc); 
        contentDiv.appendChild(dateid);
        contentDiv.appendChild(eventin);
        contentDiv.appendChild(locationid);
        contentDiv.appendChild(link);

        //Bæti svo #content divinu við cardið og bæti svo cardinu við fragmentið
        card.appendChild(contentDiv);
        fragment.appendChild(card);
    });
    return fragment;
}

function render(data) {
    //Birti fragmentið
    const contentContainer = document.querySelector("main");
    contentContainer.appendChild(data);

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
        await delay(1200);

        try {
            //fetcha, bý til fragment, svo rendera ég það
            const data = await getData(); 
            fragment = fragmentMaker(data);
            render(fragment);

            //filli upp loaderinn
            loaderBar.style.width = "100%";
        } catch (err) {
            //ef error birti það í error tagginu og bæti við hiddenerr klasan til þess að hava flott style
            document.querySelector('#errors').textContent = err.message;
            document.querySelector('#errors').classList.add('show');
            console.log(err);
        } finally {
            //Þegar allt er búið að loadast þá fadea út loaderinn
            const loader = document.getElementById("overlay").classList.add("hidden");
        }
    })();
});