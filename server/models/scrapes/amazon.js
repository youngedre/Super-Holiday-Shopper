const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const db = require("../StoreSearch");
mongoose.connect("mongodb://localhost/ShoppingDatabase", { useNewUrlParser: true });

function wait (ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms))
}

async function amazonSearch(searchBarTerm) {
    try{
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let url = 'http://www.amazon.com/s?k='+searchBarTerm
    await page.goto(url, {waitUntil: 'load'});
    const bodyHandle = await page.$('body');
    const { height } = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    const viewportHeight = page.viewport().height;
    let viewportIncr = 0;
    while(viewportIncr +viewportHeight <height ){
        await page.evaluate(_viewportHeight => {
            window.scrollBy(0, _viewportHeight);
        }, viewportHeight);
        await wait(20);
        viewportIncr = viewportIncr + viewportHeight
    }
    await page.evaluate(_ => {
        window.scrollTo(0, 0)
    });
    await wait(100);
    const items = await page.evaluate((searchBarTerm) => {
        let storeSource = 'Amazon';
        let data = [];
        const titleTextSearch = 'a.a-link-normal img';
        const priceTextSearch = 'span.a-price span.a-offscreen';
        const linkTextSearch = 'a.a-link-normal'
        const grabInfo = (item) => {
          if(item.querySelector(titleTextSearch) && item.querySelector(priceTextSearch)){
          title = item.querySelector(titleTextSearch).alt.trim();
          price = item.querySelector(priceTextSearch).innerText.trim();
          image = item.querySelector(titleTextSearch).src.trim();
          itemLink = item.querySelector(linkTextSearch).href.trim();
        }else{
            title = 'failedTitle';
            price = 'failedPrice';
            image = 'failedImage';
            itemLink = 'failedLink'
        }
    };
        const allItems = document.querySelectorAll('div.sg-col-4-of-12');
        for(b of allItems){
            grabInfo(b)
            data.push({
                title,
                price,
                image,
                itemLink,
                storeSource,
                searchedTerm: searchBarTerm
            });
        }
        return data
        }, searchBarTerm)
        const newItems = []
        let i=0;
        for (let k=0; i<15; k++) {
            try{ 
                if((items[k].title !== 'failedTitle') && (items[k].price.charAt(0) === '$')){
                    i++;
                    newItems.push(items[k]);
                    db.create(items[k]);};
                }catch(err){console.log(err);}
          }
        console.log('Check Database');
        await browser.close();
        return newItems
        }catch(err){console.log(err)}    
};

module.exports = amazonSearch