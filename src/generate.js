import Papa from 'papaparse';
import { log } from '.';
const { ipcRenderer } = window.require('electron');

const alertRoot = document.querySelector('#alert-root');

// ipcRenderer.on('write-file-reply', (event, data) => {
//     if (data === 'ok') {
//         log('Output text file generated successfully. You can find it at dir: "report/**".')
//         return
//     }

//     log('Failed to save file. Something went wrong.', false, data)
// });

export default function Generate(file, onCompleted) {

    try {
        if (!file) {
            // show alert when file is undefined
            const origHTML = alertRoot.innerHTML;
            alertRoot.innerHTML += `
            <div class="alert alert-danger me-2 d-flex align-items-center" role="alert">
                <svg class="bi flex-shrink-0" fill="red" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
                <label id="alert-txt">
                No file selected
                </label>
            </div>`

            setTimeout(() => {
                alertRoot.innerHTML = origHTML;
            }, 2000);

            return;
        }

        log('Parsing your file. Please wait a moment...', true)

        let rows = 0;
        const responseCodes = {};
        const labelCounts = {};
        const labelResponseCodeCounts = {};
        const errResponseCodeCounts = {};
        const responseTime = {};

        Papa.parse(file, {
            header: true,
            worker: true,
            dynamicTyping: true,
            step: function (results, parser) {
                rows++;
                const row = results.data;

                responseTime[row.label] = (responseTime[row.label] || 0) < row.elapsed ? row.elapsed : responseTime[row.label]

                // count the response codes
                responseCodes[row.responseCode] = (responseCodes[row.responseCode] || 0) + 1;

                if (row.responseCode !== 200) {
                    labelCounts[row.label] = (labelCounts[row.label] || 0) + 1;

                    if (!labelResponseCodeCounts[row.label]) {
                        labelResponseCodeCounts[row.label] = {};
                    }

                    if (!errResponseCodeCounts[row.responseCode]) {
                        errResponseCodeCounts[row.responseCode] = 0;
                    }

                    errResponseCodeCounts[row.responseCode] = (errResponseCodeCounts[row.responseCode] || 0) + 1;
                    labelResponseCodeCounts[row.label][row.responseCode] = (labelResponseCodeCounts[row.label][row.responseCode] || 0) + 1;
                }
            },
            complete: async function (results) {

                log('Parsing complete.');
                log('...');

                log('Getting the top 5 samples that has the most errors...', true);
                const top5Labels = Object.entries(labelCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(entry => entry[0]);

                log('Done.');
                log('...');

                log('Getting the top 3 response codes...', true);

                // get all the sum of the errResponseCodeCounts
                const errSum = Object.values(errResponseCodeCounts).reduce((a, b) => a + b, 0);

                let top3ResponseCodes = Object.entries(errResponseCodeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map((entry, i) => `${i+1}. ${entry[0]} (${((entry[1] / errSum) * 100).toFixed(2)}% in errors/${((entry[1] / rows) * 100).toFixed(2)}% in all samples)`);


                log('Done.');
                log('...');

                let mostFreqResCode = [];

                top5Labels.forEach(label => {
                    const responseCodes = Object.entries(labelResponseCodeCounts[label]);
                    mostFreqResCode.push(responseCodes.reduce((a, b) => a[1] > b[1] ? a : b)[0]);
                    
                });

                const responseCodesMapped = Object.entries(responseCodes)
                .map(entry => `There are [${entry[1].toLocaleString()}] ${entry[0]}`)
                .join('\n\t');

                log('Getting maximum response time...', true);

                const maxResponseTime = Object.entries(responseTime)
                    .sort((a, b) => b[1] - a[1])[0];

                log('Done.');
                log('...');

                const logs = `
    Success: ${((responseCodes['200'] / rows) * 100).toFixed(2)}%
    Fails: ${((errSum / rows) * 100).toFixed(2)}%
    -------------------------------
    ${responseCodesMapped}
    -------------------------------
    Top 5 sample that has the most errors: 
    ${top5Labels.map((label, i) => `${i+1}. ${label} (${mostFreqResCode[i]})`).join('\n\t')}
    -------------------------------
    Top 3 response codes:
    ${top3ResponseCodes.join('\n\t')}
    -------------------------------
    Max response time: 
    ${maxResponseTime[0]}: ${maxResponseTime[1].toLocaleString()}ms (${((maxResponseTime[1] / 1000) / 60).toFixed(2)} minutes)
                `

                onCompleted(logs);

                // ipcRenderer.send('write-file', 'report/output.txt', _log);
            }
        });
    } catch (error) {
        console.error(error);
    }
}
