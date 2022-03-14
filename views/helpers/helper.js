const LICENSE_NUMBER_LENGTH = 16
const REFERENCE_LENGTH = 8
const  POSTCODE_LENGTH = 5



const inputChecker = (input,type) => {
    const enteredInput = input.trim()
    let drivingLicense_valid;
    let reference_valid;
    let postcode_valid;

    if(enteredInput.length === LICENSE_NUMBER_LENGTH && type === "driving_license"){
        drivingLicense_valid = true
        return drivingLicense_valid
    }else if(enteredInput.length < LICENSE_NUMBER_LENGTH && type === "driving_license"){
        drivingLicense_valid = true
        return drivingLicense_valid

    }

    
    if(enteredInput.length === REFERENCE_LENGTH && type === "reference"){

        reference_valid = false
        return reference_valid

    } else if (enteredInput.length < REFERENCE_LENGTH && type === "reference"){

        reference_valid = false
        return reference_valid

    }



    if(enteredInput.length >= POSTCODE_LENGTH && type === "postcode"){

        const postcode_valid = true
        return postcode_valid

    }else if(enteredInput.length >= POSTCODE_LENGTH && type === "postcode"){

         postcode_valid = false
        return postcode_valid
    }
    


}


module.exports = { inputChecker }