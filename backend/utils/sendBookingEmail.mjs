import nodemailer from "nodemailer";
import QRCode from "qrcode";

export const sendBookingEmail = async ({
  email,
  fullName,
  bookingId,
  movieName,
  seatType,
  seats,
  transactionId,
}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const seatsList = seats.join(", ");

  // Generate QR code as buffer
  const qrData = `Quick Show Booking
Booking ID: ${bookingId}
Transaction ID: ${transactionId}
Movie: ${movieName}
Seat Type: ${seatType}
Seats: ${seatsList}`;

  const qrBuffer = await QRCode.toBuffer(qrData, { width: 200 });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Quick Show – Booking Confirmed (#${bookingId})`,
    html: `
      <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin:auto; padding:20px; background: linear-gradient(145deg, #1a1a1a, #0d0d0d); border-radius:16px; color:#f5f5f5;">
        <h2 style="text-align:center; color:#ffcc00; margin-bottom:8px;">🎬 Quick Show</h2>
        <h3 style="text-align:center; color:#e6e6e6; margin-bottom:20px;">Booking Confirmed!</h3>

        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Movie:</strong> ${movieName}</p>
        <p><strong>Seat Type:</strong> ${seatType}</p>
        <p><strong>Seats:</strong> ${seatsList}</p>

        <div style="margin:20px 0; border-top:2px dashed #ffcc00;"></div>

        <div style="text-align:center; margin-top:20px;">
          <img src="cid:qrCode" alt="Booking QR Code" style="width:200px; height:200px;"/>
          <p style="font-size:14px; color:#ccc; margin-top:8px;">Scan this QR at the theater entrance</p>
        </div>

        <p style="text-align:center; font-style:italic; color:#aaa; margin-top:20px;">Thank you for booking with Quick Show! Enjoy your movie 🍿</p>

        <div style="text-align:center; margin-top:20px; border-top:2px solid #ffcc00; padding-top:10px;">
          <p style="font-size:14px; color:#f5f5f5;">Powered by <strong>Quick Show</strong></p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `booking-${bookingId}.png`,
        content: qrBuffer,
        cid: "qrCode", // same as img src
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};
