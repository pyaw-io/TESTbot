const LICENCE_NUMBER_LENGTH = 18; // increase values by 2 because turning to string add 2 quote character
const REFERENCE_LENGTH = 10;
const POSTCODE_LENGTH = 7;
const date = new Date()
const openingTime = 300
const closingTime = 1410

module.exports = {
  openingTime,
  closingTime,
  inputChecker: (input, type) => {
    
    let enteredInput = JSON.stringify(input).trim()
    let drivingLicence_valid;
    let reference_valid;
    let postcode_valid;
    

    if (
      enteredInput.length === LICENCE_NUMBER_LENGTH &&
      type === "driving_licence"
    ) {
      drivingLicence_valid = true;
      return drivingLicence_valid;
    } else if ( enteredInput.length !== LICENCE_NUMBER_LENGTH && type === "driving_licence"
    ) {
      drivingLicence_valid = false;
      return drivingLicence_valid;
    }

    if (enteredInput.length === REFERENCE_LENGTH && type === "reference") {

      reference_valid = true;
      return reference_valid;
    } else if (enteredInput.length !== REFERENCE_LENGTH  && type === "reference")
     {
      // console.log('reference');
      reference_valid = false;
      return reference_valid;
    }

    if (enteredInput.length >= POSTCODE_LENGTH && type === "postcode") {
      const postcode_valid = true;
      return postcode_valid;
    } else if (enteredInput.length < POSTCODE_LENGTH && type === "postcode") {
      postcode_valid = false;
      return postcode_valid;
    } else{
      return false
    }
  },

  
  waitTimer : (min,max) =>{
    const waitTime = Math.floor(Math.random() * (max - min)) + min;
    return waitTime

  },

  timeChecker: () => {
    const hour = date.getHours() * 60
    return hour

  },

 


};
