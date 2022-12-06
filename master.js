const navItemHandler = (e) => {
    const items = document.querySelectorAll('.nav-item');
    items.forEach(item => {
        item.classList.remove('focus');
    })

    e.currentTarget.classList.add('focus');
    document.querySelector('page').className = e.currentTarget.dataset.view;
}

const navListeners = () => {
    const items = document.querySelectorAll('.nav-item');
    items.forEach(item => {
        item.onclick = navItemHandler;
    })
}
navListeners();


class PageSwitcher {
    constructor() {}

    static switchTo(view) {
        const item = document.querySelector(`.nav-item[data-view="${view}"]`);
        item.dispatchEvent(new Event('click', {bubbles: true}))
    }
}


window.onload = () => {
    PageSwitcher.switchTo('tasks')
    tasksAllCall();
};
