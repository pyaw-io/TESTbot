require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
const randomUseragent = require("random-useragent");

// const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

(async () => {
 
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certifcate-errors",
    "--ignore-certifcate-errors-spki-list"
  ];

  const options = {
    args,
    headless: false,
    ignoreHTTPSErrors: true,
    userDataDir: "./tmp",
  }; 

  await puppeteer.use(pluginStealth());
  const browser = await puppeteer.launch({...options});
  const page = (await browser.pages())[0];
  // const page = await browser.newPage();

  const waitTime  = (Math.floor(Math.random() * (3000 - 1000) ) + 1000)

   





    //use ddg to trick bot as coming from search site
  await page.goto('https://duckduckgo.com/?q=dvsa+change+driving+test+date&t=h_&ia=web');

  await page.waitForTimeout(waitTime);
  


  //click dvsa link in search results
  await page.click('a[href="https://www.gov.uk/change-driving-test"]');
  await page.waitForTimeout(waitTime);


//change viewport
   await page.waitForTimeout(waitTime);

   await page.viewport({
    width: 1024 + Math.floor(Math.random() * 100),
    height: 768 + Math.floor(Math.random() * 100),
})


await page.waitForTimeout(waitTime);
   //remove page cookies
  const cookies = await page.cookies('https://www.gov.uk/change-driving-test');
  await page.deleteCookie(...cookies)

  await page.waitForTimeout(waitTime);

  //check if it bypass bot detection

  // const pageCheck =

  
//click on change test link 
  await page.click('a[href="https://driverpracticaltest.dvsa.gov.uk/login"]');
  await page.waitForTimeout(waitTime);
 
  //check for queue
  
    if (await page.$('#driving-licence-number') == null) {
      await page.waitForTimeout(30000);
      console.log('waited 30 secs')        
      } 


   await page.waitForSelector('#driving-licence-number')


  //type user details

  await page.type("#driving-licence-number", "OWUSU908078E99PB", { delay: waitTime });
  await page.type("#application-reference-number", "49262237", {
    delay: waitTime,
  });


  await page.waitForTimeout(waitTime);

  await page.click("input[type=submit]");
  await page.waitForTimeout(waitTime);

  //click on change test venue 
  await page.click('a[href="/manage?execution=e1s1&_eventId=editTestCentre"]');
  await page.waitForTimeout(waitTime);


  //clear placeholderinput and type postcode and submit
  await page.click("#test-centres-input", {clickCount: 3})

  await page.waitForTimeout(waitTime);
  await page.keyboard.press('Backspace')

  await page.waitForTimeout(waitTime);

  await page.type("#test-centres-input", "LS119PX", { delay: waitTime });

  await page.waitForTimeout(waitTime);
  await page.keyboard.press('Enter')

  await page.waitForTimeout(waitTime);


  const expandResults = async () =>{
    
    for (let i = 0; i < 16; i++) {

      await page.click("#fetch-more-centres")
      await page.waitForTimeout(3000)
        
        
      }



  }

  await expandResults()



  

  




  await page.waitForTimeout(waitTime);

  

  const venue = await page.$$eval('.underline > h4', element => element.map( city=> city.textContent) );


  const date = await page.$$eval('.underline > h5', element => element.map( date => date.textContent.slice(-11)) );






  let results = await Object.assign.apply({}, venue.map( (v, i) => ( {[v]: date[i]} ) ) );

  console.log(results);


  




  return

  await browser.close();
})();

