require("dotenv").config();
const CryptoJS = require("crypto-js");
const express = require("express");
const mongoose = require("mongoose");
const md5 = require("md5");
const ejs = require("ejs");
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
const helper = require("./views/helpers/helper");
const PORT = process.env.PORT || 3000;
const currentTime = helper.timeChecker();
const openingTime = helper.openingTime;
const closingTime = helper.closingTime;

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

let drivingLicence_valid = true;
let reference_valid = true;
let postcode_valid = true;
let opened = true;
let filteredResults;
let browserError;
let autoUser;
let hashId;
let userDetails = {
    LicenceNumber: "",
    reference: "",
    postcode: ""

  }
  


mongoose.connect(process.env.MONGO_SERVER);

//create schema
const userSchema = new mongoose.Schema({
  userId: String,
  licence: String,
  reference: String,
  postcode: String,
  results: [{ venue: String, date: String }],
});

const Securitykey = process.env.SECRET_KEY;
// const secret = process.env.ENCKEY;

//connect with mongoose
const User = mongoose.model("User", userSchema);

//check time against opening hour

const checkTime = async () => {
  if (currentTime >= openingTime && currentTime <= closingTime) {
    opened = true;
  } else {
    opened = false;
  }
};

checkTime();

const fetchResults = async (licence, reference, postcode) => {
  try {
    const args = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certifcate-errors",
      "--ignore-certifcate-errors-spki-list",
    ];

    const options = {
      args,
      headless: false,
      ignoreHTTPSErrors: true,
      userDataDir: "./tmp",
    };

    await puppeteer.use(pluginStealth());
    const browser = await puppeteer.launch({ ...options });
    const page = (await browser.pages())[0];

    //use ddg to trick bot as coming from search site
    await page.goto(
      process.env.BOTDETECTIONSOLVER
    );
  

    if (opened === false) {
      await browser.close();
    }

    await page.waitForTimeout(helper.waitTimer(2000, 4000));

  

    //click dvsa link in search results
    await page.click('a[href="https://www.gov.uk/change-driving-test"]');

    await page.waitForTimeout(helper.waitTimer(2000, 4000));

    //change viewport
    await page.waitForTimeout(helper.waitTimer(2000, 4000));

    await page.viewport({
      width: 1024 + Math.floor(Math.random() * 100),
      height: 768 + Math.floor(Math.random() * 100),
    });

    await page.waitForTimeout(helper.waitTimer(2000, 4000));
    //remove page cookies
    const cookies = await page.cookies(
      "https://www.gov.uk/change-driving-test"
    );
    await page.deleteCookie(...cookies);

    await page.waitForTimeout(helper.waitTimer(2000, 4000));

    //click on change test link
    await page.click('a[href="https://driverpracticaltest.dvsa.gov.uk/login"]');
    await page.waitForTimeout(helper.waitTimer(2000, 4000));

    //check for queue

    if ((await page.$("#driving-licence-number")) == null) {
      await page.waitForTimeout(50000);
      console.log("waiting");
    }

    await page.waitForSelector("#driving-licence-number");

    //type user details

    await page.type("#driving-licence-number", licence, {
      delay: helper.waitTimer(2000, 4000),
    });
    await page.type("#application-reference-number", reference, {
      delay: helper.waitTimer(2000, 4000),
    });

    await page.waitForTimeout(helper.waitTimer(2000, 4000));

    await page.click("input[type=submit]");
    await page.waitForTimeout(helper.waitTimer(2000, 4000));

    //click on change test venue
    await page.click(
      'a[href="/manage?execution=e1s1&_eventId=editTestCentre"]'
    );
    await page.waitForTimeout(helper.waitTimer(2000, 4000));

    await page.click("#test-centres-input", { clickCount: 3 });
    //clear placeholderinput and type postcode and submit

    await page.waitForTimeout(helper.waitTimer(2000, 4000));
    await page.keyboard.press("Backspace");

    await page.waitForTimeout(helper.waitTimer(2000, 4000));

    await page.type("#test-centres-input", postcode, {
      delay: helper.waitTimer(2000, 4000),
    });

    await page.waitForTimeout(helper.waitTimer(2000, 4000));
    // await page.keyboard.press("Enter");
    await page.click("input[name=testCentreSubmit]");

    await page.waitForTimeout(helper.waitTimer(2000, 4000));

    const expandResults = async () => {
      for (let i = 0; i < 5; i++) {
        await page.click("#fetch-more-centres");
        await page.waitForTimeout(5000);
      }
    };

    await expandResults();

    await page.waitForTimeout(helper.waitTimer(2000, 4000));

    const venue = await page.$$eval(".underline > h4", (element) =>
      element.map((city) => city.textContent)
    );

    const sliceDate = await page.$$eval(".underline > h5", (element) =>
      element.map((date) => date.textContent.slice(-11))
    );

    const date = sliceDate.map((item) => item.replaceAll("/", "-"));

    const unfilteredDates = await date.map((date, i) => {
      if (date !== "dates found") {
        return { date: date, venue: venue[i] };
      }
    });

    const availableDates = await unfilteredDates.filter((data) => {
      return data !== undefined;
    });

    //format results into an array of objects

    filteredResults = availableDates;

    if (autoUser) {
      await User.findOne({ userId: hashId }, (err, foundUser) => {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            User.findOneAndUpdate(
              { userId: hashId },
              { result: availableDates },
              {
                new: true,
              },
              (err) => {
                console.log(err);
              }
            );
          } else {
            const user = new User({
              userId: userDetails.userId,
              licence: userDetails.licence,
              reference: userDetails.reference,
              postcode: userDetails.postcode,
              results: availableDates,
            });

            user.save();
          }
        }
      });
    }

    await page.waitForTimeout(helper.waitTimer(2000, 4000));

    await browser.close();
    return filteredResults
  } catch {
    (error) => {
      console.log(error);
    
      browserError = true
      browser.close();
    };
  }
};




app.get("/", (req, res) => {
  
  res.render("login", {
    licence_isvalid: drivingLicence_valid,
    reference_isvalid: reference_valid,
    postcode_isvalid: postcode_valid,
    userDetails:userDetails,
    opening_time: opened,
  });
});

app.get("/error", (req, res) => {
  res.render("error", {
    opening_time: opened,
  });
});
app.get("/terms", (req, res) => {
  res.render("terms");
});
app.get("/privacy", (req, res) => {
  res.render("privacy");
});

app.get("/home", (req, res) => {
  
  if(browserError ){
    
      res.render("error", {
        opening_time: opened,
      });
    

  }else if (autoUser === true) {
    User.findOne({ userId: hashId }, async (err, foundUser) => {
      if (foundUser) {
        const userDetails = foundUser;

        const licence_bytes = CryptoJS.AES.decrypt(
          userDetails.licence,
          Securitykey
        );
        const LicenceNumber = licence_bytes
          .toString(CryptoJS.enc.Utf8)
          .slice(1, -1);

        const reference_bytes = CryptoJS.AES.decrypt(
          userDetails.reference,
          Securitykey
        );
        const reference = reference_bytes
          .toString(CryptoJS.enc.Utf8)
          .slice(1, -1);

        const postcode_bytes = CryptoJS.AES.decrypt(
          userDetails.postcode,
          Securitykey
        );
        const postcode = postcode_bytes
          .toString(CryptoJS.enc.Utf8)
          .slice(1, -1);

        console.log(foundUser.result);

        if (!foundUser.result) {
          fetchResults(LicenceNumber, reference, postcode).then((results) => {
            console.log(results);
            console.log('2');

            if(results.length > 0){
              res.render("home", {
              results: filteredResults,
            });
            }else{
              
                res.render("error", {
                  opening_time: opened,
                });
              

            }

          });
        } else {
          console.log('1');


            if(filteredResults){

             res.render("home", {
            results: foundUser.result,
          });

            }else{
              
                res.render("error", {
                  opening_time: opened,
                });
              

            }
          
        }
      } else {
        console.log(err);
      }
    });
  } else {
    const { licence } = userDetails;
    const { reference } = userDetails;
    const { postcode } = userDetails;

    fetchResults(licence, reference, postcode).then((results) => {
      console.log(results);
      console.log('3');
      


            if(results){
              res.render("home", {
              results: filteredResults,
            });
            }else{
             
                res.render("error", {
                  opening_time: opened,
                });
              

            }
    });
  }
});

app.post("/", async (req, res) => {
  const drivingLicence = req.body.drivingLicence;
  const referenceNumber = req.body.reference;
  const postcode = req.body.postcode;
  const alert = req.body.alert;
  hashId = md5(req.body.drivingLicence);

  

  userDetails = {
    userId: hashId,
    licence: drivingLicence,
    reference: referenceNumber,
    postcode: postcode,
  };



  console.log(userDetails);

  //check input
  drivingLicence_valid = helper.inputChecker(drivingLicence, "driving_licence");
  console.log(drivingLicence_valid);
  reference_valid = helper.inputChecker(referenceNumber, "reference");
  console.log(reference_valid);
  postcode_valid = helper.inputChecker(postcode, "postcode");
  console.log(postcode_valid);

  if (drivingLicence_valid && reference_valid && postcode_valid) {
    if (alert === true) {
      autoUser = true;
      const encryptData = async () => {
        const encryptedLicenceNumber = CryptoJS.AES.encrypt(
          JSON.stringify(drivingLicence),
          Securitykey
        ).toString();
        const encryptedPostcode = CryptoJS.AES.encrypt(
          JSON.stringify(postcode),
          Securitykey
        ).toString();
        const encryptedReference = CryptoJS.AES.encrypt(
          JSON.stringify(referenceNumber),
          Securitykey
        ).toString();

        userDetails = {
          userId: hashId,
          licence: encryptedLicenceNumber,
          reference: encryptedReference,
          postcode: encryptedPostcode,
        };

        return userDetails;
      };

      const element = await encryptData();
      
      console.log(element);

      User.findOne({ userId: hashId }, (err, foundUser) => {
        if (!foundUser) {
          const user = new User({
            userId: hashId,
            licence: element.licence,
            reference: element.reference,
            postcode: element.postcode,
            result: [],
          });

          user.save();
          res.redirect("/home");
        } else {
          res.redirect("/home");
        }
      });
    } else {
        res.redirect("/home");
      
    }
  } else if (opened === false) {
    res.redirect("/error");
  } else {
    
    res.redirect("/");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:3000`);
});
