const { response } = require("express");

let db;

const request = indexedDB.open('budget-tracker', 1)

request.onupgradeneeded = function(event) {
    const db = event.target.result;

    db.createObjectStore('transaction', { autoIncrement: true });
}

request.onsuccess = function(event) {
    db = event.target.result;

    if( navigator.onLine ) {
        syncData();
    }
}

request.onerror = function(event) {
    console.log(event.target.errorCode)
}

function saveRecord(record) {
    const transaction = db.transaction(['transaction'], 'readwrite')

    const store = transaction.objectStore('transaction')

    store.add(record);
}

function syncData() {
    const transaction = db.transaction(['transaction'], 'readwrite')
    const store = transaction.objectStore('transaction')
    const getAll = store.getAll()

    getAll.onsuccess = function() {
        if(getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type' : 'application.json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(['transaction'], 'readwrite')
                const store = transaction.objectStore('transaction')
                store.clear();


                alert('All saved transactions have been submitted!')
            })
            .catch(err => {
                console.log(err)})

        }
    }
}

window.addEventListener('online', syncData);