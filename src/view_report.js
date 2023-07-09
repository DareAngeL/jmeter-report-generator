const urlParams = new URLSearchParams(window.location.search);
const logs = urlParams.get('data');

console.log(logs)