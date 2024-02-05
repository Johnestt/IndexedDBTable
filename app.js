let dataLength = 0;

function loaderData () {
        // Загрузите данные из IndexedDB и обновите значение dataLength
    openDB().then((db) => {
        const transaction = db.transaction(['myObjectStore'], 'readonly');
        const objectStore = transaction.objectStore('myObjectStore');

        const request = objectStore.getAll();

        request.onsuccess = () => {
            dataLength = request.result.length;
            const currentPage = parseInt(localStorage.getItem('currentPage')) || 1;
            createPaginationControls(dataLength, 1);
            loadDataForPage(currentPage);
        };
    });
}

window.addEventListener('load', loaderData);

// ...

document.getElementById('addData').addEventListener('click', () => {
    const name = prompt('Введите имя:');
    const value = prompt('Введите значение:');

    if (name && value) {
        addDataToDB(name, value);
    }
});


function loadDataForPage(page) {
    openDB().then((db) => {
        const transaction = db.transaction(['myObjectStore'], 'readonly');
        const objectStore = transaction.objectStore('myObjectStore');

        const request = objectStore.getAll();

        request.onsuccess = () => {
            const data = request.result;
            const tableBody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';

            const itemsPerPage = 50;
            const offset = (page - 1) * itemsPerPage;
            const pageData = data.slice(offset, offset + itemsPerPage);
            console.log(pageData)

            pageData.forEach((item) => {
                const row = tableBody.insertRow();
                row.insertCell().innerText = item.id;
                row.insertCell().innerText = item.name;
                row.insertCell().innerText = item.value;
                console.log(item.name)

                // Add edit and delete buttons
                const editButton = document.createElement('button');
                editButton.innerText = 'Редактировать';
                editButton.addEventListener('click', () => {
                    const updatedName = prompt('Введите обновленное имя:');
                    const updatedValue = prompt('Введите обновленное значение:');

                    if (updatedName && updatedValue) {
                        updateDataInDB(item.id, updatedName, updatedValue);
                    }
                });
                row.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.innerText = 'Удалить';
                deleteButton.addEventListener('click', () => {
                    deleteDataFromDB(item.id);
                });
                row.appendChild(deleteButton);
            });
            
            localStorage.setItem('currentPage', page);
        };
    });
}

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('myDatabase', 1);

        request.onerror = (event) => {
            reject(event.target.errorCode);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('myObjectStore')) {
                db.createObjectStore('myObjectStore', { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
    });
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function addDataToDB(name, value) {
    openDB().then((db) => {
        const transaction = db.transaction(['myObjectStore'], 'readwrite');
        const objectStore = transaction.objectStore('myObjectStore');
        const id = generateUniqueId();
        const request = objectStore.add({id, name, value });

        request.onsuccess = () => {
            alert('Данные добавлены');
            loadDataForPage(localStorage.getItem('currentPage'));
            //loadDataFromDB(1);
        };
    });
}

function updateDataInDB(id, name, value) {
    openDB().then((db) => {
        const transaction = db.transaction(['myObjectStore'], 'readwrite');
        const objectStore = transaction.objectStore('myObjectStore');

        const request = objectStore.get(id);

        request.onsuccess = () => {
            const data = request.result;
            data.name = name;
            data.value = value;

            const updateRequest = objectStore.put(data);

            updateRequest.onsuccess = () => {
                alert('Данные обновлены');
                //loadDataFromDB(localStorage.getItem('currentPage'));
                loadDataForPage(localStorage.getItem('currentPage'));
            };
        };
    });
}

function deleteDataFromDB(id) {
    openDB().then((db) => {
        const transaction = db.transaction(['myObjectStore'], 'readwrite');
        const objectStore = transaction.objectStore('myObjectStore');

        const request = objectStore.delete(id);

        request.onsuccess = () => {
            alert('Данные удалены');
            //loadDataFromDB(localStorage.getItem('currentPage'));
            loadDataForPage(localStorage.getItem('currentPage'));
        };
    });
}

function createPaginationControls(dataLength, currentPage) {
    const pagesCount = Math.ceil(dataLength / 50);
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= pagesCount; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.addEventListener('click', () => {
            loadDataForPage(i);
            updatePaginationControls(i);
        });
        paginationContainer.appendChild(pageButton);
    }

    if (currentPage > 1 && paginationContainer.firstChild) {
        const previousButton = document.createElement('button');
        previousButton.innerText = 'Предыдущая';
        previousButton.addEventListener('click', () => {
            loadDataForPage(currentPage - 1);
            updatePaginationControls(currentPage - 1);
        });
        paginationContainer.insertBefore(previousButton, paginationContainer.firstChild);
    }

    if (currentPage < pagesCount && paginationContainer.firstChild) {
        const nextButton = document.createElement('button');
        nextButton.innerText = 'Следующая';
        nextButton.addEventListener('click', () => {
            loadDataForPage(currentPage + 1);
            updatePaginationControls(currentPage + 1);
        });
        paginationContainer.appendChild(nextButton);
    }
}

function updatePaginationControls(page) {
    const paginationContainer = document.getElementById('pagination');
    const pagesCount = Math.ceil(dataLength / 50);

    while (paginationContainer.firstChild) {
        paginationContainer.firstChild.remove();
    }

    for (let i = 1; i <= pagesCount; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.addEventListener('click', () => {
            loadDataForPage(i);
            updatePaginationControls(i);
        });
        paginationContainer.appendChild(pageButton);
    }

    if (page > 1) {
        const previousButton = document.createElement('button');
        previousButton.innerText = 'Предыдущая';
        previousButton.addEventListener('click', () => {
            loadDataForPage(page - 1);
            updatePaginationControls(page - 1);
        });
        paginationContainer.insertBefore(previousButton, paginationContainer.firstChild);
    }

    if (page < pagesCount) {
        const nextButton = document.createElement('button');
        nextButton.innerText = 'Следующая';
        nextButton.addEventListener('click', () => {
            loadDataForPage(page + 1);
            updatePaginationControls(page + 1);
        });
        paginationContainer.appendChild(nextButton);
    }
}

function exportToExcel() {
    openDB()
        .then(db => {
            return db.transaction('myObjectStore', 'readonly')
                .objectStore('myObjectStore')
                .getAll();
        })
        .then(data => {
            data.onsuccess = (event) => {
                console.log(data.result)
                const workbook = XLSX.utils.book_new();
                const worksheet = XLSX.utils.json_to_sheet(data.result);
                XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
                XLSX.writeFile(workbook, "data.xlsx");
            }
        })
        .catch(error => {
            console.error("Error exporting data to Excel:", error);
        });
}

document.getElementById('exportButton').addEventListener('click', exportToExcel);

function importFromExcel(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Преобразуйте данные перед импортом
        const transformedData = xlData.map((item) => {
            return {
                id: generateUniqueId(),
                name: parseFloat(item.name) || item.name,
                value: parseFloat(item.value) || item.value
            };
        });

        openDB().then((db) => {
            const transaction = db.transaction(['myObjectStore'], 'readwrite');
            const objectStore = transaction.objectStore('myObjectStore');

            transformedData.forEach((item) => {
                const request = objectStore.add(item);

                request.onsuccess = () => {
                    console.log('Данные успешно импортированы');
                };

                request.onerror = (error) => {
                    console.error('Error importing data:', error);
                };
            });

            transaction.oncomplete = () => {
                alert('Импорт завершен');
                loaderData();
            };
        });
    };

    reader.onerror = (error) => {
        console.error('Error reading file:', error);
    };

    reader.readAsBinaryString(file);
}

document.getElementById('importButton').addEventListener('click', () => {
    const importFile = document.getElementById('importFile');
    importFile.click();
});

document.getElementById('importFile').addEventListener('change', importFromExcel);

document.getElementById('clearDB').addEventListener('click', () => {
    const confirmClearDB = confirm('Вы уверены, что хотите очистить всю базу данных?');
    if (confirmClearDB) {
        clearDB();
    }
});

function clearDB() {
    openDB().then((db) => {
        const transaction = db.transaction(['myObjectStore'], 'readwrite');
        const objectStore = transaction.objectStore('myObjectStore');

        return objectStore.clear();
    }).then(() => {
        alert('База данных очищена');
        localStorage.removeItem('currentPage');
        loadDataForPage(1);
        createPaginationControls(0, 1)
    }).catch((error) => {
        console.error('Error clearing database:', error);
    });
}