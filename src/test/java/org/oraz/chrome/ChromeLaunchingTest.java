package org.oraz.chrome;

import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

public class ChromeLaunchingTest {
    private ChromeDriver driver;

    @BeforeMethod
    public void setUp() throws Exception {
        System.setProperty("webdriver.chrome.driver", "C:\\Documents and Settings\\root\\Local Settings\\Application Data\\Google\\Chrome\\Application\\chrome.exe");
        driver = new ChromeDriver();
    }

    @AfterMethod
    public void tearDown() throws Exception {
        driver.quit();
    }

    @Test(enabled = false)
    public void testLaunchChrome() throws Exception {
        driver.get("http://lenta.ru");
    }
}
