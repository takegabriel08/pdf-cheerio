import { PDFDocument } from 'pdf-lib'
import { promises as fs } from 'fs';
import * as cheerio from 'cheerio';
import axios from "axios";


// cheerio getting images
const imageUris = await getImagesUri('https://marcaje-indicatoare.ro/indicatoare-rutiere/indicatoare-de-interzicere-sau-restrictie/')

// util functions
async function getImagesUri(pageUrl) {
    var images = [];
    await axios.get(pageUrl)
        .then(res => {
            const html = res.data;
            const $ = cheerio.load(html)
            $('[data-id="cfcdba0"] img[src]').each((idx, el) => images.push(el.attribs.src))
        });
    return images;
}

async function writeUint8ArrayToFile(data, filePath) {
    try {
        await fs.writeFile(filePath, data);
        console.log(`Successfully wrote Uint8Array to ${filePath}`);
    } catch (error) {
        console.error(`Error writing Uint8Array to ${filePath}: ${error}`);
    }
}

function roundNumber(number) {
    return Math.trunc(number * 100) / 100
}

function scaleProportionally(factor, height, width) {
    return { width: width * factor, height: height * factor };
}
// Utils end


async function addImagesToPDF() {
    // Load the PDF file
    const pdfDoc = await PDFDocument.create();
    var page = pdfDoc.addPage();

    // Embed the images
    const imageFiles = imageUris;
    const imageObjects = [];
    for (const file of imageFiles) {
        const imageBytes = await fetch(file).then((res) => res.arrayBuffer());
        const imageObject = file.endsWith('.jpg') ? await pdfDoc.embedJpg(imageBytes) : await pdfDoc.embedPng(imageBytes);
        imageObjects.push(imageObject);
    }

    // Add the images to the PDF
    const { width: pageWidth, height: pageHeight } = page.getSize();

    let x = 25;
    let y = pageHeight - 110;
    const irregular = [];
    for (const imageObject of imageObjects) {
        const { width: imageWidth, height: imageHeight } = imageObject;
        const aspectRatio = imageWidth / imageHeight;
        const imageWidthScaled = 100;
        const imageHeightScaled = Math.ceil(imageWidthScaled / aspectRatio);

        if (imageHeightScaled > imageWidthScaled || imageHeightScaled < imageWidthScaled / 1.70) {
            imageObject.height = imageHeightScaled;
            imageObject.width = imageWidthScaled;
            irregular.push(imageObject)
            continue;
        }

        page.drawImage(imageObject, {
            x,
            y,
            width: imageWidthScaled,
            height: imageHeightScaled,
        });

        x += imageWidthScaled + 5
        if (pageWidth - imageWidthScaled + 5 < x) {
            x = 25
            y -= imageHeightScaled + 10;
            if (y < imageHeightScaled) {
                page = pdfDoc.addPage();
                x = 25;
                y = pageHeight - 110;
            }
        }
    }

    if (irregular.length > 0) {
        // var biggest = irregular.reduce((acc, cur) => {
        //     const curValue = cur.height > cur.width ? cur.height : cur.width;
        //     const accValue = acc.height > acc.width ? acc.height : acc.width;
        //     return curValue > accValue ? cur : acc;
        // });

        irregular.sort((a, b) => b.height - a.height)

        for (const irregularPic of irregular) {
            var { width: imageWidth, height: imageHeight } = irregularPic;
            var scaledDimensions = irregularPic.scale(0.9);
            if (irregular.indexOf(irregularPic) == 0) {
                x = 10;
                // y -= imageHeight + 5
            }
            while (scaledDimensions.height > 110) {
                scaledDimensions = scaleProportionally(0.95, scaledDimensions.height, scaledDimensions.width)
                imageWidth = scaledDimensions.width;
                imageHeight = scaledDimensions.height;
            }
            if (scaledDimensions.height < 110) {
            }

            page.drawImage(irregularPic, {
                x,
                y: y - 120,
                width: imageWidth,
                height: imageHeight,
            });

            x += imageWidth + 5

            if (pageWidth - imageHeight + 5 < x) {
                x = 10
                y -= 120;
                if (y < imageHeight) {
                    page = pdfDoc.addPage();
                    x = 10;
                    y = pageHeight - imageHeight;
                }
            }
        }
    }

    // Save the modified PDF
    const pdfBytes = await pdfDoc.save()
    const myFilePath = 'new-file-created.pdf';
    writeUint8ArrayToFile(pdfBytes, myFilePath);
}

addImagesToPDF();


// const pdfBytes = await pdfDoc.save()

// const myFilePath = 'new-file-created.pdf';

// writeUint8ArrayToFile(pdfBytes, myFilePath);