chrome.runtime.onInstalled.addListener(() => {
  chrome.action.disable();
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { hostContains: 'interactivebrokers' },
        })
      ],
      actions: [new chrome.declarativeContent.ShowAction()]
    }]);
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN", 
    function: runTaxFillLogic
  });
});

async function runTaxFillLogic() {
    const reportPeriod = document.querySelector('select[ng-model="ctrl.period"]');
    const flexPeriod = document.querySelector('#amModal_period');

    if (reportPeriod) {
        reportPeriod.value = 'string:DATE_RANGE';
        reportPeriod.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (flexPeriod) {
        flexPeriod.value = 'string:Custom';
        flexPeriod.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
        return;
    }

    const fillDates = () => {
        const f = document.getElementById('fromDate') || document.getElementById('amModal_fromDate');
        const t = document.getElementById('toDate') || document.getElementById('amModal_toDate');
        
        if (f && t && f.offsetWidth > 0) {
            const year = new Date().getFullYear() - 1;
            
            const typeValue = (el, val) => {
                el.focus({ preventScroll: true });
                el.value = val;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                
                if (window.angular) {
                    const ng = angular.element(el).controller('ngModel');
                    if (ng) {
						ng.$setViewValue(val);
                        if (ng.$commitViewValue) ng.$commitViewValue();
                        ng.$render();
                    }
                }
                
                el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
                el.blur();
            };

            typeValue(f, `${year}-01-01`);
            typeValue(t, `${year}-12-31`);

            setTimeout(() => {
                const selectors = '.uib-datepicker-popup, am-date-picker-content, .dropdown-menu, .am-date-picker';
                document.querySelectorAll(selectors).forEach(p => {
                    p.style.display = 'none';
                });
            }, 150);
        } else {
            if (!window.fillerRetries) window.fillerRetries = 0;
            if (window.fillerRetries < 15) {
                window.fillerRetries++;
                setTimeout(fillDates, 200);
            } else {
                window.fillerRetries = 0;
            }
        }
    };

    fillDates();
}