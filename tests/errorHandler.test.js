const multer = require("multer");
const errorHandler = require("../src/middlewares/errorHandler");

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const req = {};
const next = jest.fn();

describe("errorHandler middleware", () => {
  test("returns 422 with size message for LIMIT_FILE_SIZE MulterError", () => {
    const err = new multer.MulterError("LIMIT_FILE_SIZE");
    const res = makeRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ errors: ["File size exceeds the 5 MB limit"] });
  });

  test("returns 422 with type message for other MulterErrors", () => {
    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
    const res = makeRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      errors: ["Invalid file type. Accepted: jpeg, png, webp, pdf"],
    });
  });

  test("returns 500 for generic errors", () => {
    const err = new Error("Something went wrong");
    const res = makeRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ errors: ["Internal server error"] });
  });
});
