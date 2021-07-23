const express = require("express");
const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const moment = require("moment");

const app = express();

app.get("/", async (req, res) => {
  const pdfDoc = await PDFDocument.load(
    fs.readFileSync(path.join(__dirname, "..", "src", "assets", "test.pdf"))
  );
  await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const pages = pdfDoc.getPages();
  let jsString = "";
  for (let pageNumber = 0; pageNumber < pages.length; pageNumber++) {
    let page = pages[pageNumber];
    const { width, height } = page.getSize();
    const pageId = `page${pageNumber}`;
    const form = pdfDoc.getForm().createTextField(pageId);
    form.enableReadOnly();
    form.addToPage(page, { x: 0, y: 0, width, height });
    jsString += `this.getField('${pageId}').display = display.hidden;`;
  }
  const dateExpired = moment().add(1, "minute");
  const expired = {
    year: dateExpired.year(),
    month: dateExpired.month(),
    day: dateExpired.date(),
    hour: dateExpired.hour(),
    minute: dateExpired.add(1, "minute").minute(),
  };
  pdfDoc.addJavaScript(
    "main",
    `
    timeNow = new Date();
    timeExpired = new Date(${expired.year},${expired.month},${expired.day},${expired.hour},${expired.minute});
    if (timeNow.getTime() >= timeExpired.getTime()) {
        app.alert('expired at '+timeExpired+'');
    } else {
      app.alert('will be expired at '+timeExpired+'');
        ${jsString}
    }`
  );
  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes.buffer, "binary");
  return res
    .status(200)
    .header("Content-disposition", "attachment; filename=testexpire.pdf")
    .header("Content-type", "application/pdf")
    .send(pdfBuffer);
});
app.listen(process.env.PORT || 5000, () => {
  console.log(process.env.PORT || 5000);
});
