# Business Process Automation Component

- System provides the dynamic form and workflow creation features.
- System enables the dynamic creation of a Forms from the admin side and can be activated and deactivated as per the admin requirement.
- System provides a tabular list of currently operating Approval Request and its Flow in between users while maintaining workflow logs.
- System provides a feature of document attachment within the workflow and backed with encrypted file system.
- System provides unique features of a group or single approval system.
- System has metadata for the attachments considering load balancing of bandwidth usage.
- System provides the standard and summary-based Approval Report to print and preserves as sign copy.
- System provides a unique identifier for each request that can be used to track the Approval Request.
- System provides highly secure password policy features.
- System provides the user authentication to be secure i.e. even without the IP blocking the system is secure and client-side will not be able to request the admin side details.
- System provides the rich-text comment box feature that enables the users to work as in word documents.
- System provides Approval monitoring and tracking features.
- System provides document attachment features integrated with workflow and its supports Microsoft Office, PDF, JEPG, PNG etc.
- System allows the user to preview the attached document inside the application and can give feedback or write an opinion on assigned request.
- System supports secure and efficient storage thus ensures scalability.
- System supports encryption of documents and can be stored in server farm environments.
- System provides highly secure portal for Customer Onboarding Services through internet.
- System Provides customer login, which enables the customer to request, which also has another layer of OTP authentication.
- System provides the customer request execution portal for bank, which is integrated with the Forms and workflow within the bank environment.
- System provides a separate user interface for customer and bank users in the HTML forms which has a secure window to provide integrated relation between both the parties.
- System provides to-and-fro of the request for the customer and bank, which is fluent and robust.
- System provides the features of email notification, alerts or can be integrate with SMS gateway.
- System provides API integration with third-party solution.
- System is device responsive and supports both the Windows and Linux environment.

# Installation

BPA requires [Node.js](https://nodejs.org/) v12+ to run.

Install the dependencies and devDependencies and start the server.

```sh
$ cd bpa-api
$ npm install
```

Create `.env` file similar to `.env.example` and update the credentials before running below command

```sh
$ npm start
```

**For production environments...**
Similar to above but you have to add one extra variable during production i.e.`NODE_ENV = production`

Also, instead of using `npm start` to run the server you'll have to follow some production standard library like `pm2`

[![pm2](https://nodei.co/npm/pm2.png?downloads=true&downloadRank=true)](https://www.npmjs.com/package/pm2)

```sh
$ pm2 start index.js --name <YOUR_PROJECT_NAME|bpa>
```
