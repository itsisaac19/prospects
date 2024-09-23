import dayjs from 'dayjs'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list';

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  initialView: 'dayGridMonth',
  plugins: [dayGridPlugin, listPlugin ],
  titleFormat: {
    year: 'numeric', 
    month: 'long'
  },
  eventTimeFormat: {
    hour: 'numeric',
    minute: '2-digit',
    omitZeroMinute: true
  },
  headerToolbar: {
    start: 'prev,next today', // will normally be on the left. if RTL, will be on the right
    center: 'title',
    end: 'dayGridMonth dayGridWeek' 
  },
  buttonText: {
    month: 'month',
    week: 'week'
  }
})

global.calendar = calendar;
class CalendarManager {
    constructor(instance) {
        this.instance = instance;
    }

    animateResize(animationDuration, interval=10) {
        this.instance.updateSize();

        const animateInterval = setInterval(() => {
            this.instance.updateSize();
        }, interval)

        setTimeout(() => {
            clearInterval(animateInterval)
        }, animationDuration + 100)
    }

    showSideBar() {
        let wrapper = document.querySelector('.outer-calendar-grid');
        wrapper.classList.add('sidebar');

        setTimeout(() => {
            wrapper.classList.remove('collapse-toggles')
        }, 300);

        this.animateResize(300, 0)
    }

    hideSideBar() {
        let wrapper = document.querySelector('.outer-calendar-grid');
        wrapper.classList.remove('sidebar');

        this.animateResize(300, 0);

        setTimeout(() => {
            wrapper.classList.add('collapse-toggles')
        }, 300)
    }

    handleIconClick(e) {
        let wrapper = document.querySelector('.outer-calendar-grid');
        if (wrapper.classList.contains('sidebar')) {
            Manager.hideSideBar()
        } else {
            Manager.showSideBar()
        }
    }

    displayMessage(heading='', paragraph='') {
        let messageElement = document.querySelector('.message');
        messageElement.classList.add('grid');

        this.messageElementTimeout = setTimeout(() => {
            messageElement.classList.add('show');
        }, 100)

        messageElement.children[0].children[0].innerHTML = heading;
        messageElement.children[0].children[1].innerHTML = paragraph;
    }

    appendParagraphToMessage(element) {
        let messageElement = document.querySelector('.message');
        let paragraph = messageElement.children[0].children[1];

        paragraph.appendChild(element)
    }
    completeCalendarRequestVisual(index) {
        let messageElement = document.querySelector('.message');
        let paragraph = messageElement.children[0].children[1];
        let calendarToComplete = paragraph.querySelector(`[id="${index}"]`);
        calendarToComplete.classList.add('fetched');

        calendarToComplete.onanimationiteration = () => {
            calendarToComplete.classList.remove('fetching')
            calendarToComplete.onanimationiteration = null;
        }
    }

    hideMessage() {
        let messageElement = document.querySelector('.message');

        if (this.messageElementTimeout) {
            clearTimeout(this.messageElementTimeout)
        }
        this.messageElementTimeout = null;

        messageElement.classList.remove('show');
        messageElement.children[0].children[0].innerHTML = null;
        messageElement.children[0].children[1].innerHTML = null;

        setTimeout(() => {
            messageElement.classList.remove('grid');
        }, 300)
    }

    insertCalItem(sourceId, cal={calendarName: '', calendarBackgroundColor: '', calendarBorderColor: ''}) {
        if (document.querySelector(`[data-sourceid="${sourceId}"]`)) {
            return console.log('cal already exists (refetched)')
        }

        const item = Object.assign(document.createElement('div'), {
            className: 'cal-item',
            innerHTML: `                       
                <div class="name">${cal.calendarName}</div>
                <div class="color-tile">
                    <div class="color" style="background:${cal.calendarBackgroundColor}; border-color:${cal.calendarBorderColor};"></div>
                </div>
                <div class="toggle">
                    <div class="toggle-button toggle-hide" data-sourceid=${sourceId}>
                        <button class="hide">Hide</button>
                    </div>
                    <div class="toggle-button toggle-show active" data-sourceid=${sourceId}>
                        <button class="show">Show</button>
                    </div>
                </div>
            `
        })

        item.querySelector('.toggle-hide').onclick = (e) => {
            if (e.currentTarget.classList.contains('active')) return;
            let sid = e.currentTarget.dataset.sourceid;
            e.currentTarget.classList.add('active');
            e.currentTarget.nextElementSibling.classList.remove('active');


            let source = this.instance.getEventSourceById(sid);

            console.log('removing source', source);
            source.remove();
        }
        item.querySelector('.toggle-show').onclick = (e) => {
            if (e.currentTarget.classList.contains('active')) return;
            let sid = e.currentTarget.dataset.sourceid;
            e.currentTarget.classList.add('active');
            e.currentTarget.previousElementSibling.classList.remove('active');

            let source = this.instance.getEventSourceById(sid);

            console.log('refetching source', source)
            getCalendarData(sid)
        }
         
        let list = document.querySelector('.calendars-list');
        list.insertBefore(item, list.firstElementChild);

        return item;
    }

    cacheCalendar(calObject) {
        let cached = localStorage.getItem('calendarObjects');
        if (cached) {
            let parsed = JSON.parse(cached);

            let alreadyCached = parsed.find(cal => cal.url == calObject.url);
            if (alreadyCached) return alreadyCached;

            console.log('calObject pushed to cache');

            parsed.push(calObject);
            localStorage.setItem('calendarObjects', JSON.stringify(parsed));
        } else {
            console.log('calObject pushed to cache (first)');
            localStorage.setItem('calendarObjects', JSON.stringify([calObject]) );
        }
    }

    removeCalendar(url) {
        let cached = localStorage.getItem('calendarObjects');
        let parsed = JSON.parse(cached);
        let indexOfCal;
            
        let calendarObject = parsed.find((cal, index) => {
            if (cal.url == url) {
                indexOfCal = index;
                return true;
            }
        });

        parsed.splice(indexOfCal, 1)
        localStorage.setItem('calendarObjects', JSON.stringify(parsed));
        console.log(`removed cal at index ${indexOfCal}`, {calendarObject, parsed})
    }

    getCachedCalendars() {
        let cached = localStorage.getItem('calendarObjects');
        if (cached) {
            let parsed = JSON.parse(cached); 
            return parsed;
        } 

        return null;
    }
}

const Manager = new CalendarManager(calendar)
global.Manager = Manager;

document.querySelector('page').addEventListener('pageSwitch', (e) => {
    if (e.currentTarget.classList.contains('calendar')) {
        setTimeout(() => {
            calendar.render();
            calendar.setOption('height', '100%');
        })
    }
})

const calendarUrl = new URL(`webcal://p121-caldav.icloud.com/published/2/MTA4MjIzNzgwODEwODIyM-o_0g2Bg19eJf4ClyVE83xWO6CRGqjlRYD8nqgUmsl3kq3gAtRux2rhW6DEsRU2l-qi5mfxo9a2ViIaeYjKQhHLv_SFNuyO2kha63qQWp4nu8KZ80IVCH13vbHz2nOSDg`)

const cleanUrl = (url) => {
    let clean = url;

    if (typeof url == 'string') {
        clean = new URL(url);
    }
    
    if (!clean.protocol.includes('http')) {
        clean.protocol = 'https:'
    }

    return clean.href;
}
cleanUrl(calendarUrl);

const isValidURL = ((url) => url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g));


const Color = require('color');
global.Color = Color;

const compliantFullCalendarSource = (raw, url) => {
    let source = {
        events: Object.values(raw)
    };

    let VCALENDAR = source.events.find(VEVENT => VEVENT.type === 'VCALENDAR')

    if (VCALENDAR) {
        let backgroundColor;

        if (VCALENDAR['APPLE-CALENDAR-COLOR']) {
            backgroundColor = Color(VCALENDAR['APPLE-CALENDAR-COLOR'], 'hex').lighten(0.6).rotate(-10).rgb().string();
        } else if (VCALENDAR.prodid?.includes('Google')) {
            backgroundColor = Color('#578c8a').rotate(Math.floor(Math.random() * (361))).rgb().string()
        } else {
            backgroundColor = Color('#ad5555').rotate(Math.floor(Math.random() * (361))).rgb().string()
        }
        
        source.backgroundColor = backgroundColor;
        source.id = url;

        let borderColor = Color(backgroundColor).rgb().string();
        if (Color(backgroundColor).isDark()) {
            borderColor = Color(backgroundColor).lighten(0.5).rgb().string()
        } 


        let toBeCachedCalObject = {
            VCALENDAR: VCALENDAR,
            calendarBackgroundColor: backgroundColor,
            calendarBorderColor: borderColor,
            url: url,
        }
        console.log(`Calendar: "${VCALENDAR['WR-CALNAME']}" `, toBeCachedCalObject)
        let alreadyCachedObject = Manager.cacheCalendar(toBeCachedCalObject)

        if (alreadyCachedObject) {
            console.log('ruh oh', alreadyCachedObject);

            backgroundColor = alreadyCachedObject.calendarBackgroundColor;
            source.backgroundColor = backgroundColor;
            borderColor = alreadyCachedObject.calendarBorderColor;
        }

        Manager.insertCalItem(url, {
            calendarName: VCALENDAR['WR-CALNAME'],
            calendarBackgroundColor: backgroundColor,
            calendarBorderColor: borderColor
        })

    }

    for(let a = 0, l = source.events.length; a < l; a++) {
        const VEVENT = source.events[a];

        VEVENT.title = VEVENT.summary;

        let eventURL = VEVENT.url?.val;

        if (typeof eventURL == 'string') {
            if (isValidURL(eventURL)) {
                VEVENT.url = eventURL;
                console.log('valid url: ', eventURL, VEVENT);
            } else {
                delete VEVENT.url;
            }
        } 

        if (dayjs(VEVENT.start).isSame(dayjs(VEVENT.end), 'day')) {

        } else {
            VEVENT.allDay = true;

            if (source.backgroundColor) {
                let allDayColor = Color(source.backgroundColor).darken(0.5).desaturate(0.3).fade(0.4).rotate(-5).hexa();
                VEVENT.backgroundColor = allDayColor;
                VEVENT.borderColor = Color().fade(1).hexa();
                //console.log('all-day: ', allDayColor)
            }
        }
    };

    return source;
}
const placeEvents = (raw, url) => {
    const source = compliantFullCalendarSource(raw, url);

    console.log('adding event source', source)
    calendar.addEventSource(source)

    let sortedEvents = timeStampSort(raw)
    console.log('events sorted by date', {sortedEvents})
}

const clearCalendarCache = () => {
    let calendarObjects = Manager.getCachedCalendars();
    calendarObjects.forEach(calObject => {
        let timeOfLastCache = localStorage.getItem(`${calObject.url}&&time`);
        console.log('removed', timeOfLastCache, calObject.url) 
        localStorage.removeItem(`${calObject.url}&&time`);
    })
}
global.clearCalendarCache = clearCalendarCache;

const getCalendarData = async (url, index) => {
    let cached = localStorage.getItem(url);
    let timeOfLastCache = localStorage.getItem(`${url}&&time`);
    let hoursSinceLastCache = Math.abs(dayjs(timeOfLastCache).diff(dayjs(), 'hours'))

    if (cached && hoursSinceLastCache < 24) {
        console.log(`Hours since last CACHE: ${hoursSinceLastCache} (${dayjs(timeOfLastCache).format('MMM D h:mm A')})`);
        console.log('cached calendar data', JSON.parse(cached));

        placeEvents(JSON.parse(cached), url)


        return 
    }
  
    console.log('requesting through glitch server');

    const element = Object.assign(document.createElement('div'), {
        className: 'cal-url-wrap',
        innerHTML: `
        <div class="fetching cal-url" id="${index}">${url}</div>
        <div class="fetch-start">Fetching</div>
        <div class="fetch-complete">Fetched</div>
        `,
    })
    Manager.appendParagraphToMessage(element)

    const req = await fetch(`https://reminder-server.glitch.me/ical?url=${url}`, {
        method: 'POST',
    })
    const data = await req.json();
    parseCalendarData(data, url);
    
    Manager.completeCalendarRequestVisual(index)

    return data;
}


const timeStampSort = (calendarData) => {
    let sorted = {};
    let eventKeys = Object.keys(calendarData);

    for(let a = 0, l = eventKeys.length; a < l; a++) {
        const VEVENT = calendarData[eventKeys[a]];
        let eventDate = dayjs(VEVENT.start);
        let year = eventDate.get('year');

        if (!sorted[year]) {
            sorted[year] = {0:{},1:{},2:{},3:{},4:{},5:{},6:{},7:{},8:{},9:{},10:{},11:{}}
        }

        let month = eventDate.get('month');
        let dayOfMonth = eventDate.get('date');
        let dayKey = sorted[year][month][dayOfMonth];

        if (dayKey) {
            sorted[year][month][dayOfMonth].push(VEVENT)
        } else {
            sorted[year][month][dayOfMonth] = [VEVENT];
        }
    };

    return sorted;
}

const parseCalendarData = async (data, url) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let sortedEvents = timeStampSort(data)

    console.log(sortedEvents)

    localStorage.setItem(url, JSON.stringify(data));
    localStorage.setItem(`${url}&&time`, dayjs().toJSON());

    placeEvents(data, url)
}

const assignSideBarToggle = () => {
    let icon = document.querySelector('.fixed-menu-icon');
    icon.onclick = Manager.handleIconClick;
}
assignSideBarToggle();



const calendarAdderHandler = async (e) => {
    let input = document.querySelector('input.cal-link');
    let url = cleanUrl(input.value);

    let adderWrapper = e.currentTarget.parentElement;
    adderWrapper.classList.add('load');
    input.value = null;

    let alreadyAdded = Manager.getCachedCalendars().find(calObject => calObject.url == url)
    
    if (alreadyAdded) {
        Manager.displayMessage(`Calendar already exists`, `The calendar you added already exists: <div class="exists">"${alreadyAdded.VCALENDAR['WR-CALNAME']}"</div> `)
        
        const element = Object.assign(document.createElement('button'), {
            className: 'message-confirm',
            innerHTML: 'back'
        })
        Manager.appendParagraphToMessage(element);

        element.onclick = () => {
            Manager.hideMessage();
        }

        return console.log(url, 'was already added')
    }

    let provider = 'iCalendar';
    if (url.includes('google')) provider = 'Google Calendar';
    Manager.displayMessage(`Retrieving ${provider} data. This will take a few moments.`, 'Want faster speeds? <a href="https://www.buymeacoffee.com/isaactsai">Buy me a Coffee!</a>')

    const element = Object.assign(document.createElement('div'), {
        className: 'cal-url-wrap',
        innerHTML: `
        <div class="fetching cal-url" id="1">${url}</div>
        <div class="fetch-start">Fetching</div>
        <div class="fetch-complete">Fetched</div>
        `,
    })
    Manager.appendParagraphToMessage(element)

    let data = await getCalendarData(url);
    Manager.completeCalendarRequestVisual(1)

    adderWrapper.classList.remove('load');
    Manager.hideMessage()
}
const assignCalendarAdder = () => {
    let adderButton = document.querySelector('.cal-add-button');
    adderButton.onclick = calendarAdderHandler;
}
assignCalendarAdder();


const getCachedCalendars = async () => {
    let cached = Manager.getCachedCalendars();
    if (cached) {
        let calendarCalls = [];
        let str = '';

        Manager.displayMessage('Fetching calendars...');

        cached.forEach((calObject, index) => {
            console.groupCollapsed(`%cFetching cached calendar @${new URL(calObject.url).hostname}...`, 
            "font-weight:500;font-size:15px;padding: 10px 0 10px;")
            console.log({calObject});
            console.groupEnd();
            
        
            let call = getCalendarData(calObject.url, index);
            calendarCalls.push(call);

            str += (`<br><u>${calObject.url.substring(0, 60)}...</u>`)
        })

        

        await Promise.all(calendarCalls);
        Manager.hideMessage();
    }
}
getCachedCalendars();