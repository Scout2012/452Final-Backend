"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailClient = void 0;
const nodemailer_1 = require("nodemailer");
class EmailClient {
    constructor(user, pass, service) {
        this.createTransporter = (service, auth) => {
            let transport_config = {
                service: service,
                auth: auth
            };
            let transporter = nodemailer_1.createTransport(transport_config);
            if (!transporter) {
                console.debug("Could not create transporter.");
                return null;
            }
            return transporter;
        };
        this.user = user;
        this.pass = pass;
        this.service = service;
    }
    sendEmail(to, subject, body, service) {
        if (!this.service && service) {
            console.debug("Please specify a service.");
            return null;
        }
        if (!this.user || !this.pass) {
            console.debug("Please initialize your user and password for the client.");
            return null;
        }
        let transporter = this.createTransporter(service || this.service, { user: this.user, pass: this.pass });
        if (!transporter) {
            console.debug("Could not create transporter!");
            return null;
        }
        let mailOptions = {
            from: this.user,
            to: to,
            subject: subject,
            text: body
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                return null;
            }
            console.debug("Email sent: " + info.response);
        });
    }
}
exports.EmailClient = EmailClient;
