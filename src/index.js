const express = require("express") 
const fs = require('fs') 
const path = require('path')
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib") ;
const moment = require('moment')

const app = express();

app.get("/", async (req, res) => {
  const pdfDoc = await PDFDocument.load(
    fs.readFileSync(path.join(__dirname, "..","src", "assets", "test.pdf"))
  )
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const page = pdfDoc.getPage(0)
  const { width, height } = page.getSize();
  const form = pdfDoc.getForm()
  const pageId = 'page0'
  const superheroField = form.createTextField(pageId)
  superheroField.enableReadOnly()
  superheroField.addToPage(page, { x: 0, y: 0, width, height })
  const dateNow = moment().add(1, 'minute')
  const expired = {
      year: dateNow.year(),
      month: dateNow.month(),
      day: dateNow.date(),
      hour: dateNow.hour(),
      minute: dateNow.add(1, 'minute').minute()
  }
  pdfDoc.addJavaScript(
    "main",
    `
    timeNow = new Date();
    timeExpired = new Date(${expired.year},${expired.month},${expired.day},${expired.hour},${expired.minute});
    if (timeNow.getTime() >= timeExpired.getTime()) {
        app.alert('expired at '+timeExpired+'');
    } else {
        this.getField('${pageId}').display = display.hidden;
    }`
  );
  const pdfBytes = await pdfDoc.save()
    const pdfBuffer = Buffer.from(pdfBytes.buffer, "binary")
    return res
      .status(200)
      .header("Content-disposition", "attachment; filename=qrcode.pdf")
      .header("Content-type", "application/pdf")
      .send(pdfBuffer)

});

app.listen(5000, () => {
  console.log(5000);
});
