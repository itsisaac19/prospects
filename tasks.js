import ContextMenu from '@mturco/context-menu';
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
                    <button class="adder" tabindex="0" data-key="${this.letters[data.index].toLowerCase()}" data-bid="${data.bid}">${this.letters[data.index]}</div>
                    </button>
                <div class="bin-list">
                </div>
            `
        });
        
        grid.appendChild(element);

        // Sidebar
        const sidebarList = document.querySelector('.bins-list')
        const sidebarBin = Object.assign(document.createElement('div'), {
            className: 'sidebar-bin',
            innerHTML: `                       
                <div class="name">${data.label}</div>
            `
        });
        sidebarBin.dataset.bid = data.bid;
        
        sidebarList.appendChild(sidebarBin)
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

            let isOverDue = dayjs().isAfter(dayjs(dueDate));

            let itemElement = Object.assign(document.createElement('button'), {
                className: 'bin-item',
                id: item.id,
                innerHTML: `
                    <div class="bin-item-title">${item.title}</div>
                    <div class="bin-item-due-date${isOverDue ? ' overdue' : ''}" id="${dueDate || ''}">${dueDateReadable}</div>
                    <div class="bin-item-description-preview">${item.description}</div>
                `,
                tabIndex: 0
            });

            itemElement.dataset.description = item.description;
            listItems+= itemElement.outerHTML;
        });

        const bin = document.querySelector(`[id="${bid}"]`)
        bin.querySelector('.bin-list').innerHTML = listItems;
    }
    addItemToBin(newItem) {
        const bins = document.querySelectorAll(`[id="${newItem.bid}"]`)

        let dueDate = newItem.due_at;
        let dueDateReadable = '';
        if (dueDate) {
            if (dayjs(dueDate).isSame(dayjs(), 'day')) {
                dueDateReadable = dayjs(dueDate).format('h[:]mm A');
            } else {
                dueDateReadable = dayjs(dueDate).format('MMM D');
            }
        } 
        let isOverDue = dayjs().isAfter(dayjs(dueDate));

        const itemElement = Object.assign(document.createElement('button'), {
            className: 'bin-item',
            id: newItem.id,
            innerHTML: `
                <div class="bin-item-title">${newItem.title}</div>
                <div class="bin-item-due-date ${isOverDue ? ' overdue' : ''}" id="${dueDate || ''}">${dueDateReadable}</div>
                <div class="bin-item-description-preview">${newItem.description}</div>
            `
        });
        itemElement.dataset.description = newItem.description;

        bins.forEach(bin => {
            console.log(bin)
            bin.querySelector('.bin-list').appendChild(itemElement.cloneNode(true));
        })
    }
    updateItem(uuid, data) {
        const items = document.querySelectorAll(`.bin-item[id="${uuid}"]`);

        let dueDate = data.due_at;
        let dueDateReadable = '';
        if (dueDate) {
            if (dayjs(dueDate).isSame(dayjs(), 'day')) {
                dueDateReadable = dayjs(dueDate).format('h[:]mm A');
            } else {
                dueDateReadable = dayjs(dueDate).format('MMM D');
            }
        } 
        let isOverDue = dayjs().isAfter(dayjs(dueDate));

        items.forEach(item => {
            item.innerHTML = `
            <div class="bin-item-title">${data.title}</div>
            <div class="bin-item-due-date ${isOverDue ? ' overdue' : ''}" id="${dueDate || ''}">${dueDateReadable}</div>
            <div class="bin-item-description-preview">${data.description}</div>
            `

            item.dataset.description = data.description;
        })
    }
    removeItemFromBin(uuid) {
        const elements = document.querySelectorAll(`.bin-item[id="${uuid}"]`);
        elements.forEach(element => {
            element.remove();
        })
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
            assignAllHandlers()
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
            assignAllHandlers()
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

const sidebarBinHandler = (e) => {
    e.currentTarget.parentElement.querySelector('.active')?.classList.remove('active');
    e.currentTarget.classList.add('active');

    let bid = e.currentTarget.dataset.bid;
    showBinView(bid);
    splitPaneHandler(false, e);

    document.querySelector('.view-box.active')?.classList.remove('active');
    document.querySelector('.view-box.split').classList.add('active');
}

const showBinView = (bid) => {
    let grid = document.querySelector('.tasks-grid')
    let bin = document.querySelector(`.task-bin[id="${bid}"]`);
    let contentWrapper = document.querySelector('.tasks-bin-view .content');

    if (contentWrapper.childElementCount > 0) {
        contentWrapper.innerHTML = null;
    }

    let binClone = bin.cloneNode(true);
    contentWrapper.appendChild(binClone);
    attachHandlersToBin(binClone);

    if (window.innerWidth >= 600) {

    } else {
        grid.classList.remove('show');
        contentWrapper.classList.add('show');
    }
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

    const taskGrid = document.querySelector('.tasks-grid-wrap');
    let x = taskGrid.contains(e.currentTarget);
    let paneIsOpen = document.querySelector('.split-pane') ? true : false;

    if (paneIsOpen && x) {
        document.querySelector('.in-pane')?.classList.remove('in-pane')
        e.currentTarget.parentElement.classList.add('in-pane');
        return;
    }  

    cleanFloater();
    disableAdderKeys();
    assignFloaterShortcuts();
    floater.classList.add('grid');

    let centerOnScreen = false;

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
        if (e.detail === 0) {
            console.log('KEYBOARD');
            floater.querySelector('input.title').focus();
            centerOnScreen = true;
        }

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
    if (e.clientY + floater.offsetHeight > window.innerHeight - 71) {
        clientYCorrected = e.clientY - floater.offsetHeight;
        console.log('flip to TOP!', {e, clientYCorrected, floater_height: floater.offsetHeight})

        if (clientYCorrected < 0) {
            clientYCorrected = 0;
        } 
    }

    if (centerOnScreen === true) {
        clientXCorrected = (window.innerWidth / 2) - (floater.offsetWidth / 2);
        clientYCorrected = (window.innerHeight / 2) - (floater.offsetHeight / 2);
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
    
    let currentlyVisitedHintItem = document.querySelector('.visited-hint')
    if (currentlyVisitedHintItem) {
        console.log('hint item', currentlyVisitedHintItem)
        currentlyVisitedHintItem.classList.remove('visited-hint')
    } else {
        let currentlyFocusedItem = document.querySelector('.current-focus')
        if (currentlyFocusedItem) {
            currentlyFocusedItem.classList.remove('current-focus');
            currentlyFocusedItem.classList.add('visited-hint');
            currentlyFocusedItem.focus();
        }
    }

    
    setTimeout(() => {
        if (block) {
            floater.classList.remove('grid');
        }

        cleanFloater();
        assignAdderKeys();
        disableFloaterShortcuts();
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

const assignCreateItemHandlers = (disable=false) => {
    let letterActivatedHandlers = document.querySelectorAll('.adder');
    letterActivatedHandlers.forEach(l => {
        if (disable) {
            return l.onclick = null;
        }
        l.onclick = adderHandler;
    })
}

const viewTaskHandler = (e) => {
    const uuid = e.currentTarget.id;

    document.querySelector('.current-focus')?.classList.remove('current-focus')
    e.currentTarget.classList.add('current-focus');

    let currentlyVisitedHintItem = document.querySelector('.visited-hint')
    if (currentlyVisitedHintItem) {
        currentlyVisitedHintItem.classList.remove('visited-hint')
    }

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
const assignViewTaskHandlers = (disable=false) => {
    let taskElements = document.querySelectorAll('.bin-item');
    taskElements.forEach(t => {
        if (disable) {
            return t.onclick = null;
        }
        t.onclick = viewTaskHandler;
    })
}

const editBinHandler = (e) => {
    if (e.target.classList.contains('adder')) return;
    let bid = e.currentTarget.children[1].dataset.bid;

    document.querySelector('.current-focus')?.classList.remove('current-focus')

    let recalculate = false;
    if (!document.querySelector('.split-pane')) {
        recalculate = true;
    }

    let boundingRect = () => e.currentTarget.getBoundingClientRect()
    let xOfRect = e.clientX - boundingRect().x;
    //let yOfRect = e.clientY- boundingRect().y;

    let respectiveSidebarElement = document.querySelector(`.sidebar-bin[data-bid="${bid}"]`);
    respectiveSidebarElement.dispatchEvent(new MouseEvent('click'))

    if (recalculate) {
        let clientXCorrected = boundingRect().x + xOfRect + 20;
        Object.defineProperty(e, 'clientX', {
            writable: false, 
            value: clientXCorrected
        });

        Object.defineProperty(e, 'clientY', {
            writable: false, 
            value: e.currentTarget.getBoundingClientRect().y + 20
        });
    }


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
const assignEditBinHandlers = (disable=false) => {
    let binBanners = document.querySelectorAll('.bin-banner');
    binBanners.forEach(b => {
        if (disable) return b.onclick = null;
        b.onclick = editBinHandler;
    })
}

const assignViewBinHandlers = (disable=false) => {
    let sidebarLabels = document.querySelectorAll('.sidebar-bin');
    sidebarLabels.forEach(b => {
        if (disable) return b.onclick = null;
        b.onclick = sidebarBinHandler;
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
const assignCreateBinHandler = (disable=false) => {
    let adder = document.querySelector('.bin-adder');
    if (disable) return adder.onclick = null;
    adder.onclick = createBinHandler;
}
const assignCancelHandler = (disable=false) => {
    let cancelButton = document.querySelector('.tasks-floater .cancel-box');
    if (disable) return cancelButton.onclick = null;
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

    console.log(e)
    if (e.target.classList.contains('bin-adder') || document.querySelector('.bin-adder').contains(e.target)) return;

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

const assignFloaterOutclick = (disable=false) => {
    if (disable) return document.removeEventListener('mousedown', floaterOutclickHandler)
    document.addEventListener('mousedown', floaterOutclickHandler)
}

const adderKeyDownHandlers = (e) => {
    let addersPressed = Array.from(document.querySelectorAll('.adder')).filter(adder => {
        return e.key == adder.dataset.key || e.key == adder.dataset.key.toUpperCase();
    });

    if (addersPressed) {
        addersPressed.forEach(adderPressed => {
            adderPressed.classList.add('down');
        })
    }
}

const adderKeyUpHandlers = (e) => {
    let addersPressed = Array.from(document.querySelectorAll('.adder')).filter(adder => {
        return e.key == adder.dataset.key || e.key == adder.dataset.key.toUpperCase();
    });

    if (addersPressed.length > 0) {
        addersPressed.forEach(adderPressed => {
            adderPressed.classList.remove('down')
        });

        console.log(addersPressed[0])
        addersPressed[0].dispatchEvent(new MouseEvent('click', {
            clientX: addersPressed[0].getBoundingClientRect().x + 20,
            clientY: addersPressed[0].offsetTop + 20
        }));  
    }
}

const assignAdderKeys = () => {
    document.body.addEventListener('keydown', adderKeyDownHandlers);
    document.body.addEventListener('keyup', adderKeyUpHandlers);
}
const disableAdderKeys = () => {
    document.body.removeEventListener('keydown', adderKeyDownHandlers);
    document.body.removeEventListener('keyup', adderKeyUpHandlers);
}

const floaterShortcuts = (e) => {
    let box;

    console.log(e, e.getModifierState(e.key))

    if (e.key === "Tab") {
        let floater = document.querySelector('.tasks-floater');
        if (floater.contains(document.activeElement)) {
            return console.log('all good.')
        } else {
            box = document.querySelector(`.box[shortcut="Escape"]`);
        }
    }

    if (e.key === "Escape") {
        e.preventDefault();
        box = document.querySelector(`.box[shortcut="${e.key}"]`);
    }

    if (e.key === "Enter" && e.ctrlKey === true) {
        box = document.querySelector(`.box[shortcut="Control+Enter"]`);
    }

    if (e.key === "Delete") {
        box = document.querySelector(`.box[shortcut="${e.key}"]`);
    }

    if (box) {
        box.dispatchEvent(new MouseEvent('click'));    
    }
}

const assignFloaterShortcuts = () => {
    document.body.addEventListener('keyup', floaterShortcuts);
}
const disableFloaterShortcuts = () => {
    document.body.removeEventListener('keyup', floaterShortcuts);
}

const taskViewSwitchHandler = (e) => {
    document.querySelector('.view-box.active')?.classList.remove('active');
    e.currentTarget.classList.add('active');

    let selectedView = e.currentTarget.dataset.view

    if (selectedView == 'dashboard') {
        let grid = document.querySelector('.tasks-grid')
        let viewWrapper = document.querySelector('.tasks-bin-view');
            
        document.querySelector('.sidebar-bin.active')?.classList.remove('active');
        
        grid.classList.add('show');
        viewWrapper.classList.remove('show');
    }

    if (selectedView == 'split') {
        splitPaneHandler(false, e);
    } else {
        splitPaneHandler(true, e);
    }
}
const assignViewSwitchers = () => {
    const switchers = document.querySelectorAll('.view-box');
    switchers.forEach(s => {
        s.onclick = taskViewSwitchHandler;
    })
}

const attachHandlersToBin = (binElement) => {
    binElement.querySelector('.bin-banner').onclick = editBinHandler;

    binElement.querySelectorAll('.bin-item').forEach(t => {
        t.onclick = viewTaskHandler;
    })

    binElement.querySelector('.adder').onclick = adderHandler;

/*     const menu = new ContextMenu('', [{
        name: 'Hello',
        fn: (e) => {
            console.log(e)
        }
    }], {
        className: 'custom-theme',
        minimalStyling: true,
    })  */
}

const splitPaneHandler = (disable, e) => {
    let outerGrid = document.querySelector('.outer-tasks-grid');
    if (disable) return outerGrid.classList.remove('split-pane');
    if (!e.currentTarget.classList.contains('view-box')) {
        return outerGrid.classList.add('split-pane');
    }

    let firstAvailablePopulatedBinId = Array.from(document.querySelectorAll('.bin-list')).find(b => {
        return b.children.length > 0;
    })?.parentElement?.id || document.querySelector('.task-bin')?.id;
    
    if (firstAvailablePopulatedBinId) {
        let sidebarElement = document.querySelector(`.sidebar-bin[data-bid="${firstAvailablePopulatedBinId}"]`);
        sidebarElement.dispatchEvent(new MouseEvent('click'));
    }
}

const paneHandleMouseDownHandler = (e) => { 
    if (!e.target.classList.contains('handler') && !e.target.classList.contains('handler-bar')) return; 
    console.log('DOWN, ASSIGIN MOVE & UP', e)

    document.addEventListener('mouseup', paneHandleMouseUpHandler)
    document.addEventListener('mousemove', paneHandleMouseMoveHandler)
}
const paneHandleMouseMoveHandler = (e) => {
    console.log('move', e);

    let targetView = document.querySelector('.tasks-bin-view');
    let targetColumnWidth = targetView.offsetWidth
    if (e.movementX) {
        let previousWidth = parseFloat(targetColumnWidth);
        let adjustedWidth = previousWidth + e.movementX;

        console.log({previousWidth, adjustedWidth})
        targetView.style.width = adjustedWidth + 'px'
    }

}
const paneHandleMouseUpHandler = (e) => {
    console.log('UP, REMOVING MOUSE MOVE & SELF', e)

    document.removeEventListener('mousemove', paneHandleMouseMoveHandler)
    document.removeEventListener('mouseup', paneHandleMouseUpHandler)
}

const assignPaneHandleHandlers = (disable) => {
    let handlerWrapper = document.querySelector('.handler-wrap')
    let handle = handlerWrapper.firstElementChild;
    if (disable) {
        document.removeEventListener('mousedown', paneHandleMouseDownHandler)
        document.removeEventListener('mousemove', paneHandleMouseMoveHandler)
        document.removeEventListener('mouseup', paneHandleMouseUpHandler)
        return 
    }

    document.addEventListener('mousedown', paneHandleMouseDownHandler)
}

const assignAllHandlers = () => {
    assignCreateItemHandlers(); 
    assignCreateBinHandler();
    assignCancelHandler();

    assignEditBinHandlers();
    assignViewBinHandlers();

    assignViewTaskHandlers();

    assignFloaterOutclick();
    assignAdderKeys();

    assignViewSwitchers();

    assignPaneHandleHandlers();
}

const disableAllHandlers = () => {
    assignCreateItemHandlers(true); 
    assignCreateBinHandler(true);
    assignCancelHandler(true);

    assignEditBinHandlers(true);
    assignViewBinHandlers(true);

    assignViewTaskHandlers(true);

    assignFloaterOutclick(true);
    disableFloaterShortcuts();
    disableAdderKeys();
}

const signInUser = async (credentials) => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials)
    if (!error && data) {
        initialFetch(data.session.user.id)
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

        initialFetch(data.session.user.id)
    } 
}

let inProgress = true;

const initialFetch = async (uid) => {
    const userid = uid || await authHandler();
    if (!userid) return;

    document.querySelector('.outer-tasks-grid').classList.remove('auth')
    closeFloater();
    console.log('using: ', userid)
    localStorage.setItem('userid', userid);

    let data = await loadBins(userid);

    disableAllHandlers();
    assignAllHandlers();

    return data;
}
const initialReq = initialFetch();


const load = (e) => {
    if (e.currentTarget.classList.contains('tasks')) {
        assignAllHandlers();
    } else {
        disableAllHandlers();
    }
}

document.querySelector('page').addEventListener('pageSwitch', load)

