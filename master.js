class PageSwitcher {
    constructor() {}

    static switchTo(view) {
        document.querySelector('.nav .focus')?.classList.remove('focus');
        
        const item = document.querySelector(`.nav-item[data-view="${view}"]`);
        item.classList.add('focus');
    
        document.querySelector('page').className = view;
        console.log('SWITCHING TO "' + view + '"')
        document.querySelector('page').dispatchEvent(new Event('pageSwitch'))
    }
}

const navItemHandler = (e) => {
    PageSwitcher.switchTo(e.currentTarget.dataset.view)
}

const navListeners = () => {
    const items = document.querySelectorAll('.nav-item');
    items.forEach(item => {
        item.onclick = navItemHandler;
    })
}
navListeners();

window.onload = () => {
    PageSwitcher.switchTo('calendar')
};
