import Generate from "./generate";

const genBtn = document.querySelector('#gen-btn');
const fileInput = document.querySelector('#file');
const logBox = document.querySelector('.log-box');
const reportViewRootContainer = document.querySelector('#report-view-root-container');
const viewReportBtn = document.querySelector('#view-report');

let generatedReport = '';

/**
 * Logs to the logbox
 * @param {string} log 
 * @param {boolean} isLoading 
 * @param {string} err 
 */
export const log = (log, isLoading, err) => {
    
    const isLoadingHTML = `
    <div class="d-flex">
        <p>${log}</p>
        <div class="loading-ic loading ms-3 mt-1"/>
    </div>`;

    if (isLoading) {
        logBox.innerHTML += isLoadingHTML;
    } else {

        const loading = document.querySelector('.loading');
        if (loading) {
            loading.classList.remove('loading');
        }

        logBox.innerHTML += `<p>${log}</p>`;
        logBox.innerHTML += err ? `<p class="text-danger">${err}</p>` : '';
    }

    logBox.scrollTop = logBox.scrollHeight;
}

viewReportBtn.addEventListener('click', () => {

    const viewReportHTML = `
    <div class="report-view-container p-5">
        <button id="go-back-btn" class="btn btn-outline-dark"><- Go Back</button>
        <h2 class="mt-3">Generated Report</h2>
        <div class="report-view-root p-3 rounded-2">
        <label id="report-view-txt">${generatedReport}</label>
        </div>
    </div>
    `;

    reportViewRootContainer.innerHTML += viewReportHTML;

    const gobackBtn = document.querySelector('#go-back-btn');
    const reportViewContainer = document.querySelector('.report-view-container');

    gobackBtn.addEventListener('click', () => {

        // add reverse/close animation class
        reportViewContainer.classList.add('reverse');
        // listen when animation is done
        reportViewContainer.addEventListener('animationend', () => {
            // remove the container
            reportViewContainer.remove();
        });

    });
});

genBtn.addEventListener('click', () => { 
    
    logBox.innerHTML = '';
    viewReportBtn.classList.replace('v-report-visible', 'v-report-hidden');
    
    Generate(fileInput.files[0], (logs) => {
        // on generation complete, set the generated report
        // separate the logs with a new line
        generatedReport = logs.split('\n').map(log => `<p>${log}</p>`).join('');

        // make the view report button visible
        if (viewReportBtn.classList.contains('v-report-hidden')) {
            viewReportBtn.classList.replace('v-report-hidden', 'v-report-visible');
        } else {
            viewReportBtn.classList.add('v-report-visible');
        }
    })
});