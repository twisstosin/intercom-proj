const { Router } = require('express');
const fs = require('fs').promises;

const router = Router();

/**
 * Constants INTERCOM_DUBLIN_COORDINATES, OUTPUT_FILE_PATH, INPUT_FILE_PATH
 */

const INTERCOM_DUBLIN_COORDINATES = { lat: 53.339428, long: -6.257664 };
const OUTPUT_FILE_PATH = 'output.txt';
const INPUT_FILE_PATH = 'data/customers.txt';

function distanceInRadians(coordinate) {
  const { PI } = Math;
  return (coordinate * PI) / 180;
}

function listToArray(data) {
  return JSON.parse(`[${data.replace(/\n/g, ',')}]`);
}

function getStringObjectArray(array) {
  return array.map((object) => JSON.stringify(object));
}

async function readCustomersFile(path) {
  return fs.readFile(path, 'utf8');
}

async function writeCustomersFile(path, array) {
  return fs.writeFile(path, getStringObjectArray(array).join('\n').toString());
}

function greatCircleDistance(options) {
  const RADIUS_OF_EARTH = 6371e3;
  const {
    lat1,
    long1,
    lat2,
    long2
  } = options;

  const lat1Radians = distanceInRadians(lat1);
  const lat2Radians = distanceInRadians(lat2);
  const latDifferenceRadians = distanceInRadians(lat2 - lat1);
  const longDifferenceRadians = distanceInRadians(long2 - long1);

  /**
   * Using havershine's computational formula for Great-circle distance
   */

  const a = Math.sin(latDifferenceRadians / 2) * Math.sin(latDifferenceRadians / 2)
    + Math.cos(lat1Radians) * Math.cos(lat2Radians) * Math.sin(longDifferenceRadians / 2)
    * Math.sin(longDifferenceRadians / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = RADIUS_OF_EARTH * c;

  // distance in kms.
  return d / 1000;
}

/* GET index page. */
router.get('/', async (req, res) => {
  try {
    const data = await readCustomersFile(INPUT_FILE_PATH);
    const customersArray = listToArray(data);
    const resultCustomerArray = [];

    for (let i = 0; i < customersArray.length; i++) {
      const long = customersArray[i].longitude;
      const lat = customersArray[i].latitude;
      const coords = {
        lat1: lat,
        long1: long,
        lat2: INTERCOM_DUBLIN_COORDINATES.lat,
        long2: INTERCOM_DUBLIN_COORDINATES.long
      };
      const distance = greatCircleDistance(coords);
      if (distance <= 100) {
        resultCustomerArray.push(customersArray[i]);
      }
    }

    // sorting array by user_id (ascending)
    resultCustomerArray.sort((a, b) => a.user_id - b.user_id);

    // write result into a file OUTPUT_FILE_PATH
    await writeCustomersFile(OUTPUT_FILE_PATH, resultCustomerArray);

    res.header('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify({
      success: true,
      message: 'output file generated',
      customers: resultCustomerArray
    }, null, 4));
  } catch (e) {
    res.header('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify({
      success: false,
      message: e.message
    }, null, 4));
  }
});

module.exports = {
  router,
  distanceInRadians,
  getStringObjectArray,
  listToArray,
  greatCircleDistance,
  writeCustomersFile,
  readCustomersFile
};
