const { BasePage } = require('./BasePage');

class AccountPage extends BasePage {
    constructor(page) {
        super(page);
        // Login Selectors
        this.loginBtnHeader = ".header-login-link, a[href*='customer/account/login']"; // Specific ID might vary, using generic
        this.emailInput = "#email";
        this.passwordInput = "#pass";
        this.signInBtn = "#send2";
        this.forgotPasswordLink = ".action.remind";
        
        // Register Selectors
        this.createAccountBtnHeader = "a[href*='customer/account/create']";
        this.firstNameInput = "#firstname";
        this.lastNameInput = "#lastname";
        this.regEmailInput = "#email_address";
        this.regPasswordInput = "#password";
        this.confirmPasswordInput = "#password-confirmation";
        this.createAccountSubmitBtn = "button.submit[title='Create an Account']";
        
        // Messages
        this.errorMessage = ".message-error, .mage-error";
        this.successMessage = ".message-success";
    }

    async navigateToLogin() {
        await this.page.goto('https://www.coversandall.com/customer/account/login/', { waitUntil: 'domcontentloaded' });
    }

    async login(email, password) {
        console.log(`Logging in with: ${email}`);
        await this.page.locator(this.emailInput).fill(email);
        await this.page.locator(this.passwordInput).fill(password);
        await this.page.locator(this.signInBtn).click();
        await this.page.waitForLoadState('networkidle');
    }

    async navigateToRegister() {
        await this.page.goto('https://www.coversandall.com/customer/account/create/', { waitUntil: 'domcontentloaded' });
    }

    async registerUser(firstName, lastName, email, password) {
        console.log(`Registering user: ${email}`);
        await this.page.locator(this.firstNameInput).fill(firstName);
        await this.page.locator(this.lastNameInput).fill(lastName);
        await this.page.locator(this.regEmailInput).fill(email);
        await this.page.locator(this.regPasswordInput).fill(password);
        await this.page.locator(this.confirmPasswordInput).fill(password);
        await this.page.locator(this.createAccountSubmitBtn).click();
        await this.page.waitForLoadState('networkidle');
    }

    async initiateForgotPassword(email) {
        await this.page.locator(this.forgotPasswordLink).click();
        await this.page.locator('#email_address').fill(email); // ID on forgot password page usually email_address
        await this.page.locator("button.action.submit.primary").click(); // "Reset My Password" button
    }

    async getErrorMessage() {
        if (await this.page.locator(this.errorMessage).first().isVisible()) {
            return await this.page.locator(this.errorMessage).first().innerText();
        }
        return null;
    }
}

module.exports = { AccountPage };
