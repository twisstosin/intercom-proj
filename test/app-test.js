const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = require('chai');
const fs = require('fs');

const {
  distanceInRadians,
  getStringObjectArray,
  listToArray,
  greatCircleDistance,
  writeCustomersFile,
  readCustomersFile
} = require('../routes/index');

const app = require('../app');
const data = require('./data');

chai.should();
chai.use(chaiHttp);

const OUTPUT_FILE_PATH = './test/output.txt';
const INPUT_FILE_PATH = './data/customers.txt';

/* Test the /GET route */
describe('app index route', () => {
  it('it should GET /', (done) => {
    chai.request(app)
      .get('/')
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });

  it('it should handle 404 error', (done) => {
    chai.request(app)
      .get('/notExist')
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});

/* Test the /conversion logic & operations */
describe('conversion operations', () => {
  it('it should read txt customer files', async () => {
    const result = await readCustomersFile(INPUT_FILE_PATH);
    // would return an empty object{} when not functional
    expect(result.length)
      .to
      .be
      .greaterThan(2);
  });
  it('it should convert distance to radians', () => {
    const result = distanceInRadians(53.339428);
    expect(result)
      .to
      .equal(0.9309486397304539);
  });

  it('it should convert an array of objects to an array of stringified objects', () => {
    const result = getStringObjectArray([{
      latitude: '53.807778',
      user_id: 28,
      name: 'Charlie Halligan',
      longitude: '-7.714444'
    },
    {
      latitude: '53.4692815',
      user_id: 7,
      name: 'Frank Kehoe',
      longitude: '-9.436036'
    },
    {
      latitude: '54.0894797',
      user_id: 8,
      name: 'Eoin Ahearn',
      longitude: '-6.18671'
    }]);
    expect(Array.isArray(result))
      .to
      .equal(true);
    expect(typeof (result[0]))
      .to
      .equal('string');
    expect(typeof (result[1]))
      .to
      .equal('string');
    expect(typeof (result[2]))
      .to
      .equal('string');
  });

  it('it should convert JSON formatted lines into an array', () => {
    const result = listToArray(data);

    expect(Array.isArray(result))
      .to
      .equal(true);
    expect(result.length)
      .to
      .equal(32);
  });

  it('it should calculate great circle distance between two points given lat and long', () => {
    const array = listToArray(data);
    const coords1 = {
      lat1: array[0].latitude,
      long1: array[0].longitude,
      lat2: array[1].latitude,
      long2: array[1].longitude
    };

    const coords2 = {
      lat1: array[2].latitude,
      long1: array[2].longitude,
      lat2: array[3].latitude,
      long2: array[3].longitude
    };
    const result1 = greatCircleDistance(coords1);
    const result2 = greatCircleDistance(coords2);
    expect(result1)
      .to
      .equal(309.93656595343907);
    expect(result2)
      .to
      .equal(139.51348059302478);
  });

  it('it should write to local file', async () => {
    const array = listToArray(data);
    await writeCustomersFile(OUTPUT_FILE_PATH, array);
  });

  after(async () => {
    await fs.unlinkSync(OUTPUT_FILE_PATH);
  });
});
