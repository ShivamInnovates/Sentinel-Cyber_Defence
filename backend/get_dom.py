import time
from selenium import webdriver
from selenium.webdriver.common.by import By

options = webdriver.ChromeOptions()
options.page_load_strategy = 'none' 
driver = webdriver.Chrome(options=options)

url = "file:///C:/Users/anura/Downloads/clone_site1/clone_site1/mcdonline.nic.in/portal.html"
driver.get(url)

time.sleep(3) 

# Close popup
try:
    close_btn = driver.find_elements(By.XPATH, "//*[@class='close' or @data-dismiss='modal'] | //*[text()='×'] | //*[text()='X'] | //button[contains(@class, 'close')]")
    if close_btn:
        driver.execute_script("arguments[0].click();", close_btn[0])
except:
    driver.execute_script("""
        var elements = document.querySelectorAll('.modal, .fancybox-overlay, .fancybox-wrap, .modal-backdrop, [style*="z-index"]');
        for(var i=0; i<elements.length; i++) {
            var z = parseInt(window.getComputedStyle(elements[i]).zIndex);
            if(z > 100 || elements[i].className.includes('modal')) { 
                elements[i].style.display = 'none'; 
            }
        }
    """)

# Click Tax Button
time.sleep(2)
try:
    pay_btn = driver.find_element(By.XPATH, "//*[contains(translate(text(), 'pay property tax', 'PAY PROPERTY TAX'), 'PAY PROPERTY TAX')]")
    driver.execute_script("arguments[0].click();", pay_btn)
except:
    try:
        pay_btn = driver.find_element(By.PARTIAL_LINK_TEXT, "PAY PROPERTY TAX")
        driver.execute_script("arguments[0].click();", pay_btn)
    except:
        pass

# Wait for navigation to finish
print("Waiting for login page to load...")
time.sleep(5)

# Dump the HTML source of the login form container for analysis
print("----- PAGE SOURCE -----")
print(driver.page_source)
print("-----------------------")

driver.quit()
