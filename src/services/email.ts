import { createTransport, Transporter } from "nodemailer";
import { Options } from "nodemailer/lib/smtp-transport";
import { Credentials } from "nodemailer/lib/smtp-connection";

export class EmailClient
{
  user : string;
  pass : string;
  service : string;

  constructor(user : string, pass: string, service: string)
  {
    this.user = user;
    this.pass = pass;
    this.service = service;
  }
  
  createTransporter = (service : string, auth : Credentials) : Transporter | null =>
  {
    let transport_config : Options = {
      service: service,
      auth: auth
    }
    let transporter : Transporter = createTransport(transport_config)

    if(!transporter) { console.debug("Could not create transporter."); return null; }

    return transporter;
  }

  sendEmail(to : string, subject : string, body : string, service? : string)
  {

    if(!this.service && service) { console.debug("Please specify a service."); return null; }
    if(!this.user || !this.pass) { console.debug("Please initialize your user and password for the client."); return null; }

    let transporter = this.createTransporter(service || this.service, {user: this.user, pass: this.pass} );
    if(!transporter) { console.debug("Could not create transporter!"); return null; }

    let mailOptions =
    {
      from: this.user,
      to: to,
      subject: subject,
      text: body
    };

    transporter.sendMail(mailOptions,
      (error, info) => 
      {
        if (error) { console.error(error); return null }
        console.debug("Email sent: " + info.response);
      }
    );
  }
}