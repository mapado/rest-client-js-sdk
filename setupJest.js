global.FormData = require('form-data');

let dateNowSpy;
export const NOW_TIMESTAMP_MOCK = 1487076708000;

beforeAll(() => {
  // Lock Time
  dateNowSpy = jest
    .spyOn(Date, 'now')
    .mockImplementation(() => NOW_TIMESTAMP_MOCK);
});

afterAll(() => {
  // Unlock Time
  dateNowSpy.mockReset();
  dateNowSpy.mockRestore();
});
