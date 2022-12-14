import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://mcbzsvpblzuuhhnkmimd.supabase.co';
const supabaseKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jYnpzdnBibHp1dWhobmttaW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk0MTY0NzMsImV4cCI6MTk4NDk5MjQ3M30.IBbM4foQteYKAVXzFV7HwewsO0boqGnHCUyDqC9r10M`;
const supabase = createClient(supabaseUrl, supabaseKey);

const dayjs = require('dayjs');
var customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

global.dayjs = dayjs;
class HTMLManager {
    constructor() {
        this.letters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
    }
    addNewBin(data) {
        let grid = document.querySelector('.tasks-grid');

        const element = Object.assign(document.createElement('div'), {
            className: 'task-bin',
            id: data.bid,
            innerHTML: `
                <div class="bin-banner">
                    <span class="blabel">${data.label}</span>
                    <div class="adder" data-key="${this.letters[data.index].toLowerCase()}" data-bid="${data.bid}">${this.letters[data.index]}</div>
                    </div>
                <div class="bin-list">
                </div>
            `
        });
        
        grid.appendChild(element);
    }
    removeBin(bid) {
        const bin = document.querySelector(`[id="${bid}"]`)
        bin.remove();
    }
    populateBin(bid, items) {
        let listItems = ``;

        items.forEach(item => {
            let dueDate = item.due_at;
            let dueDateReadable = '';
            if (dueDate) {
                if (dayjs(dueDate).isSame(dayjs(), 'day')) {
                    dueDateReadable = dayjs(dueDate).format('h[:]mm A');
                } else {
                    dueDateReadable = dayjs(dueDate).format('MMM D');
                }
            } 

            let itemElement = Object.assign(document.createElement('div'), {
                className: 'bin-item',
                id: item.id,
                innerHTML: `
                    <div class="bin-item-title">${item.title}</div>
                    <div class="bin-item-due-date" id="${dueDate || ''}">${dueDateReadable}</div>
                    <div class="bin-item-description-preview">${item.description}</div>
                `
            });

            itemElement.dataset.description = item.description;
            listItems+= itemElement.outerHTML;
        });

        const bin = document.querySelector(`[id="${bid}"]`)
        bin.querySelector('.bin-list').innerHTML = listItems;
    }
    addItemToBin(newItem) {
        const bin = document.querySelector(`[id="${newItem.bid}"]`)

        let dueDate = newItem.due_at;
        let dueDateReadable = '';
        if (dueDate) {
            if (dayjs(dueDate).isSame(dayjs(), 'day')) {
                dueDateReadable = dayjs(dueDate).format('h[:]mm A');
            } else {
                dueDateReadable = dayjs(dueDate).format('MMM D');
            }
        } 

        const itemElement = Object.assign(document.createElement('div'), {
            className: 'bin-item',
            id: newItem.id,
            innerHTML: `
                <div class="bin-item-title">${newItem.title}</div>
                <div class="bin-item-due-date" id="${dueDate || ''}">${dueDateReadable}</div>
                <div class="bin-item-description-preview">${newItem.description}</div>
            `
        });
        itemElement.dataset.description = newItem.description;
        bin.querySelector('.bin-list').appendChild(itemElement);
    }
    updateItem(uuid, data) {
        const item = document.querySelector(`.bin-item[id="${uuid}"]`);

        let dueDate = data.due_at;
        let dueDateReadable = '';
        if (dueDate) {
            if (dayjs(dueDate).isSame(dayjs(), 'day')) {
                dueDateReadable = dayjs(dueDate).format('h[:]mm A');
            } else {
                dueDateReadable = dayjs(dueDate).format('MMM D');
            }
        } 

        item.innerHTML = `
            <div class="bin-item-title">${data.title}</div>
            <div class="bin-item-due-date" id="${dueDate || ''}">${dueDateReadable}</div>
            <div class="bin-item-description-preview">${data.description}</div>
        `

        item.dataset.description = data.description;
    }
    removeItemFromBin(uuid) {
        const element = document.querySelector(`.bin-item[id="${uuid}"]`);
        element.remove();
    }
}
const DOM = new HTMLManager();
import { v4 as uuidv4 } from 'uuid';

const getItemsByBid = async (bid) => {
    const { data, error } = await supabase.from('items').select().eq('bid', bid);
    return [data, error]
}
const loadBins = async (userid) => {
    const { data, error } = await supabase.from('bins').select().eq('userid', userid);
    if (error) return console.error(error);
    
    let bins = data;
    let index = 0;
    let calls = [];

    for (const bin of bins) {
        let data = {
            label: bin.name,
            bid: bin.id,
            index: index,
        };

        DOM.addNewBin(data);
        calls.push(getItemsByBid(data.bid)) 
        index++;
    }

    let itemCallResponses = await Promise.all(calls);
    let callIndex = 0;
    for (const itemCallResponse of itemCallResponses) {
        const [items, error] = itemCallResponse;

        if (items.length > 0) {
            console.log('items found', {items});
            let bid = bins[callIndex].id;
            console.log(items)
            DOM.populateBin(bid, items)
        }
        callIndex++;
    }

    return bins;
}

// ITEMS REALTIME
supabase.channel('*').on('postgres_changes', { 
    event: '*', 
    schema: 'public',
}, payload => {
    console.log('hello', payload)

    if (payload.table == 'items') {
        if (payload.eventType == 'INSERT') {
            DOM.addItemToBin(payload.new)
            reassignAllHandlers()
        }
        if (payload.eventType == 'UPDATE') {
            DOM.updateItem(payload.new.id, payload.new)
        }
        if (payload.eventType == 'DELETE') {
            DOM.removeItemFromBin(payload.old.id)
        }
    }
    

    if (payload.table == 'bins') {
        if (payload.eventType == 'INSERT') {
            DOM.addNewBin({
                bid: payload.new.id,
                label: payload.new.name,
                index: document.querySelectorAll('.task-bin').length
            })
            reassignAllHandlers()
        } 
        if (payload.eventType == 'DELETE') {
            DOM.removeBin(payload.old.id)
        }
    }
}).subscribe()


const createBin = async (binData, cb) => {
    let uuid = uuidv4();

    const { data, error } = await supabase.from('bins').insert({
        id: uuid,
        name: binData.title,
        meta: binData.meta,
        userid: binData.userid
    }).select();

    console.log(data, error)
    if (!error) cb();

    return {uuid};
}
const archiveBin = async (bid, cb) => {
    const { error } = await supabase.from('bins').delete().eq('id', bid);

    if (!error) {
        cb()
    } else {    
        console.log(error)
    };
}
const updateBin = async (data, cb) => {
    const { bid, userid, ...clean } = data;
    const { error } = await supabase.from('bins').update(clean).eq('id', bid);

    if (!error) {
        cb()
    } else {    
        console.log(error)
    };
}

const removeDueDate = async (itemUUID, cb) => {
    const { error } = await supabase.from('items').delete().eq('id', uuid);
    if (!error) {
        //cb()
    } else {    
        console.log(error)
    };
}

const updateBinItem = async (data, cb) => {
    const { uuid, userid, ...clean } = data;
  
    const { error } = await supabase.from('items').update(clean).eq('id', uuid);

    if (!error) {
        cb()
    } else {    
        console.log(error)
    };
}

const createBinItem = async (item, cb) => {
    const { userid, ...clean } = item;
    const { data, error } = await supabase.from('items').insert(clean).select();

    console.log(data, error)
    if (!error) cb();
}

const archiveBinItem = async (uuid, cb) => {
    const { error } = await supabase.from('items').delete().eq('id', uuid);

    if (!error) {
        cb()
    } else {    
        console.log(error)
    };
}

const showFloater = (e, view, delay, listeners={
    onconfirm: () => {},
    oncancel: () => {},
    ondanger: () => {},
    onswitch: () => {}
}) => {
    let floater = document.querySelector('.tasks-floater');
    if (floater.classList.contains('show') && floater.classList.contains('mobile-view')) {
        console.log('detected mobile view and show')
        closeFloater();
        return;
    } 

    cleanFloater();
    disableAdderKeys();
    floater.classList.add('grid');

    if (view == 'create-task') {
        let binName = (e.target.parentElement.children[0].textContent.trim())
        floater.querySelector('.action').textContent = `Add task for ${binName}`;
        floater.querySelector('.confirm').textContent = `Add`;
        floater.querySelector('.danger-box').classList.add('hide')
        //floater.querySelector('input.title').focus();
        floater.classList.add('task-view')
    }
    
    if (view == 'edit-bin') {
        floater.querySelector('input.title').value = e.currentTarget.children[0].textContent;
        floater.querySelector('.action').textContent = `Edit bin`;
        floater.querySelector('.confirm').textContent = `Update`;
    } 

    if (view == 'view-task') {
        floater.querySelector('input.title').value = e.currentTarget.children[0].textContent;
        floater.querySelector('textarea.desc').value = e.currentTarget.dataset.description;
        floater.querySelector('.action').textContent = `Edit task`;
        floater.querySelector('.confirm').textContent = `Update`;

        floater.classList.add('task-view')

        if (e.currentTarget.children[1].id.length > 0) {
            let dueDate = e.currentTarget.children[1].id ? dayjs(e.currentTarget.children[1].id, 'YYYY-MM-DD[T]HH:mm') : '';
            if (dueDate) {
                console.log('due', dueDate)
                 // YYYY-MM-DDThh:mm
                let dueDateFormat = dueDate.format('YYYY-MM-DD[T]HH:mm')
                floater.querySelector('.due-date').value = dueDateFormat;
            } 
        }
    }

    if (view == 'auth') {
        floater.querySelector('.action').textContent = `Create an account to access Tasks`;
        floater.querySelector('.confirm').textContent = `Create`;
        floater.querySelector('.danger-box').classList.add('hide')
        floater.querySelector('.cancel-box').classList.add('hide')
        floater.classList.add('auth-view')

        e = {
            clientX: window.innerWidth / 2,
            clientY: window.innerHeight / 2,
        }
    }
    
    if (view == 'create-bin') {
        floater.querySelector('.action').textContent = `Add a bin`;
        floater.querySelector('.confirm').textContent = `Add`;
        floater.querySelector('.danger-box').classList.add('hide')
        floater.classList.add('create-bin-view')
        //floater.querySelector('input.title').focus();
    } 
    if (view == 'edit-bin') {
        floater.classList.add('edit-bin-view')
    }


    let clientXCorrected = e.clientX;
    let clientYCorrected = e.clientY;

    if (e.clientX + floater.offsetWidth > window.innerWidth) {
        console.log('flip to LEFT!', e);
        clientXCorrected = e.clientX - floater.offsetWidth;
    }
    if (e.clientY + floater.offsetHeight > window.innerHeight) {
        clientYCorrected = e.clientY - floater.offsetHeight;
        console.log('flip to TOP!', {e, clientYCorrected, floater_height: floater.offsetHeight})

        if (clientYCorrected < 0) {
            clientYCorrected = 0;
        } 
    }

    if (window.innerWidth >= 600 && window.innerHeight >= 750) {
        let root = document.querySelector(':root');
        root.style.setProperty('--floater-top', clientYCorrected + 'px')
        root.style.setProperty('--floater-left', clientXCorrected + 'px')
    } else {
        floater.classList.add('mobile-view')
    }


    Object.entries(listeners).forEach(ev => {
        let box = floater.querySelector(`.${ev[0].replace('on', '')}-box`);
        box.onclick = ev[1];
    })


    setTimeout(() => {
        floater.classList.add('show')
    }, delay)
}
const cleanFloater = () => {
    let floater = document.querySelector('.tasks-floater');
    floater.querySelectorAll('input, textarea').forEach(field => {
        field.value = null;
    });

    Array.from(floater.classList).forEach(floaterClass => {
        if (floaterClass.includes('-view')) {
            floater.classList.remove(floaterClass);
        };
    });
    
    floater.querySelector('.danger-box').classList.remove('hide')

    let confirmText = document.querySelector('.tasks-floater .confirm-box .confirm')
    confirmText.textContent = 'Log in';
}
const closeFloater = (block=true) => {
    let floater = document.querySelector('.tasks-floater');
    floater.classList.remove('show');
    
    setTimeout(() => {
        if (block) {
            floater.classList.remove('grid');
        }

        cleanFloater();
        assignAdderKeys();
    }, 220)
}
const getFloaterData = () => {
    let floater = document.querySelector('.tasks-floater');
    let data = {};
    floater.querySelectorAll('input, textarea').forEach(field => {
        if (field.dataset.key == 'due_at') {
            if (field.offsetParent) {
                data[field.dataset.key] = field.value ? dayjs(field.value).format('YYYY-MM-DD[T]HH:mm') : null;
            } 
        } else {
            if (field.offsetParent) {
                data[field.dataset.key] = field.value;
            }
        }
    })

    let userid = localStorage.getItem('userid');
    data.userid = userid;

    return data;
}

const adderHandler = (e) => {
    let bid = e.currentTarget.dataset.bid;
    console.log(e)
    showFloater(e, 'create-task', 0, {
        onconfirm: () => {
            let itemData = getFloaterData();
            itemData.id = uuidv4();
            itemData.bid = bid;
            createBinItem(itemData, closeFloater);
        }
    })
}

const assignCreateItemHandlers = () => {
    let letterActivatedHandlers = document.querySelectorAll('.adder');
    letterActivatedHandlers.forEach(l => {
        l.onclick = adderHandler;
    })
}

const viewTaskHandler = (e) => {
    const uuid = e.currentTarget.id;
    showFloater(e, 'view-task', 0, {
        ondanger: () => {
            let userConfirmed = confirm('Are you sure you want to archive this item?')
            if (userConfirmed == true) {
                archiveBinItem(uuid, closeFloater)
            }
        },
        onconfirm: () => {
            let itemData = getFloaterData();
            let clean = itemData;
            clean.uuid = uuid;
            console.log(clean)
            updateBinItem(clean, closeFloater)
        }
    })
}
const assignViewTaskHandlers = () => {
    let taskElements = document.querySelectorAll('.bin-item');
    taskElements.forEach(t => {
        t.onclick = viewTaskHandler;
    })
}

const viewBinHandler = (e) => {
    if (e.target.classList.contains('adder')) return;
    let bid = e.currentTarget.children[1].dataset.bid;

    showFloater(e, 'edit-bin', 0, {
        onconfirm: () => {
            let binData = getFloaterData();
            console.log('Updating bin data', binData);
            binData.bid = bid;
            binData.name = binData.title;
            const { title, ...clean } = binData;
            updateBin(clean, closeFloater);
        },
        ondanger: () => {
            let userConfirmed = confirm('Are you sure you want to archive this bin?')
            if (userConfirmed == true) {
                archiveBin(bid, closeFloater)
            }
        }
    })
}
const assignViewBinHandlers = () => {
    let binBanners = document.querySelectorAll('.bin-banner');
    binBanners.forEach(b => {
        b.onclick = viewBinHandler;
    })
}

const createBinHandler = (e) => {
    showFloater(e, 'create-bin', 0, {
        onconfirm: (e) => {
            let binData = getFloaterData();
            console.log('BIN DATA', binData);
            createBin(binData, closeFloater)
        }
    })
}
const assignCreateBinHandler = () => {
    let adder = document.querySelector('.bin-adder');
    adder.onclick = createBinHandler;
}
const assignCancelHandler = () => {
    let cancelButton = document.querySelector('.tasks-floater .cancel-box');
    cancelButton.onclick = closeFloater;
}

const floaterOutclickHandler = (e) => {
    if (e.type == 'mouseup') {
        document.onmouseup = null;
        console.log('close it!');
        closeFloater();
        return;
    }

    let floater = document.querySelector('.tasks-floater');
    let isFloater = floater.contains(e.target);

    let targetIsClickable = Array.from(document.querySelectorAll('.task-bin')).some(bin => {
        return bin.contains(e.target);
    });

    if (e.target.classList.contains('bin-adder')) return;

    if (isFloater == false) {
        if (window.innerWidth <= 600) {
            if (floater.offsetParent) {
                console.log('not on floater and small screen')
                setTimeout(() => {
                    document.onmouseup = floaterOutclickHandler;
                }, 1)
            }
        } else if (targetIsClickable == false) {
            document.onmouseup = floaterOutclickHandler;
        }
    };
}

const assignFloaterOutclick = () => {
    document.addEventListener('mousedown', floaterOutclickHandler)
}

const adderKeyDownHandlers = (e) => {
    let adderPressed = Array.from(document.querySelectorAll('.adder')).find(adder => {
        return e.key == adder.dataset.key;
    });

    if (adderPressed) {
        adderPressed.classList.add('down');
    }
}

const adderKeyUpHandlers = (e) => {
    let adderPressed = Array.from(document.querySelectorAll('.adder')).find(adder => {
        return e.key == adder.dataset.key;
    });

    if (adderPressed) {
        setTimeout(() => {
            adderPressed.dispatchEvent(new MouseEvent('click', {
                clientX: adderPressed.offsetLeft + 20,
                clientY: adderPressed.offsetTop + 20
            }));    
        }, 200)


        adderPressed.classList.remove('down')
    }
}

const assignAdderKeys = () => {
    document.body.onkeydown = adderKeyDownHandlers;
    document.body.onkeyup = adderKeyUpHandlers;
}
const disableAdderKeys = () => {
    document.body.onkeydown = null;
    document.body.onkeyup = null;
}

const reassignAllHandlers = () => {
    assignCreateItemHandlers(); 
    assignCreateBinHandler();
    assignCancelHandler();

    assignViewBinHandlers();
    assignViewTaskHandlers();
}

const signInUser = async (credentials) => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials)
    if (!error && data) {
        allCall(data.session.user.id)
    }
}

const authConfirmCallback = async (authData) => {
    let switchText = document.querySelector('.tasks-floater .switch-box .switch');
    if (switchText.textContent == 'Sign up instead') {
        console.log('signing in')
        return signInUser(authData)
    } 

    const { data, error } = await supabase.auth.signUp(authData);
    if (!error && data.user) {
        console.log('Created account, signing in user...', data)
        signInUser(authData);
    } else {
        console.error(error)
    }
}

const authHandler = async () => {
    const { data, error } = await supabase.auth.getSession()
    if (!error && !data.session) {
        console.warn('logged out', data);
        showFloater(null, 'auth', 0, {
            onconfirm: () => {
                let authData = getFloaterData(); 
                authConfirmCallback(authData)
            },
            onswitch: () => {
                let floater = document.querySelector('.tasks-floater');
                let switchText = document.querySelector('.tasks-floater .switch-box .switch')
                let confirmText = document.querySelector('.tasks-floater .confirm-box .confirm')
                if (switchText.textContent == 'Log in instead') {
                    switchText.textContent = 'Sign up instead';
                    confirmText.textContent = 'Log in';
                    floater.querySelector('.action').textContent = 'Welcome back, log in to continue'
                } else {
                    switchText.textContent = 'Log in instead'
                    confirmText.textContent = 'Create';
                    floater.querySelector('.action').textContent = 'Create an account to access Tasks'
                }
            }
        });

        document.querySelector('.outer-tasks-grid').classList.add('auth')
        return null;
    } 

    document.querySelector('.outer-tasks-grid').classList.remove('auth')

    if (data.session) {
        console.log('Found session', data.session);
        console.log('signing user in...');

        allCall(data.session.user.id)
    } 
}

const allCall = async (uid) => {
    const userid = uid || await authHandler();
    if (!userid) return;

    document.querySelector('.outer-tasks-grid').classList.remove('auth')
    closeFloater();
    console.log('using: ', userid)
    localStorage.setItem('userid', userid);

    await loadBins(userid);
    assignCreateItemHandlers();
    assignCreateBinHandler();
    assignCancelHandler();

    assignViewBinHandlers();
    assignViewTaskHandlers();

    assignFloaterOutclick();
    assignAdderKeys();

}
global.tasksAllCall = allCall;