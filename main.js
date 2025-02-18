const getData = async () => {
    //Fetcha dataið, parsar það og skilar því svo
    const url = "info.json";
    const response = await fetch(url); //fetcha dataið
    return await response.json(); //parsa jsonið og skila því
}

const render = (data) => {
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
        dateid.textContent = date;

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

//Nota IIFE fall til þess að geta notað async/await, það er ekki hægt að nota það í top level kóða
document.addEventListener("DOMContentLoaded", async () => {
    (async () => { 
        //birti loading skilaboð 
        const loadingElem = document.querySelector('#loading');
        loadingElem.textContent = 'Loading...';

        //Simulate a delay, til að prófa loading skilaboðin og hafa kannski kúl animation til að birta allt
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        await delay(1000);

        try {
            //fetcha og birti svo
            const data = await getData(); 
            const contentContainer = document.querySelector("#content");
            contentContainer.appendChild(render(data));
        } catch (err) {
            //ef error birti það í error tagginu 
            document.querySelector('#errors').textContent = err.message;
        } finally {
            //Þegar það er búið að loadast, þá tek ég loading textann út
            loadingElem.textContent = '';
        }
    })();
});