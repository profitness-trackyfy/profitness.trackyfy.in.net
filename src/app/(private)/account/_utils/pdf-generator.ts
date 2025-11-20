import jsPDF from "jspdf";

interface InvoiceData {
  subscriptionId: string;
  planName: string;
  amount: number;
  originalAmount?: number;
  discountAmount?: number;
  startDate: string;
  endDate: string;
  purchaseDate: string;
  paymentId: string;
  duration: number;
  customerName: string;
  customerEmail: string;
  paymentGateway: string;
  isCashPayment?: boolean;
  isCashApproved?: boolean;
}

// Function to convert SVG to PNG data URL
const convertSvgToPng = (
  svgString: string,
  width: number,
  height: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = width;
    canvas.height = height;

    img.onload = () => {
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Canvas context not available"));
      }
    };

    img.onerror = () => reject(new Error("Failed to load SVG"));

    const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  });
};

export const generatePDFInvoice = async (data: InvoiceData): Promise<void> => {
  try {
    // Create new PDF document
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Define border margins
    const borderMargin = 15;
    const contentMargin = 20;
    const maxContentWidth = pageWidth - contentMargin * 2;
    const maxContentHeight = pageHeight - borderMargin * 2;

    // Check if discount is applied
    const hasDiscount =
      data.originalAmount && data.discountAmount && data.discountAmount > 0;

    // Company Logo
    try {
      const logoResponse = await fetch("/favicon.svg");
      const logoSvg = await logoResponse.text();
      const logoPng = await convertSvgToPng(logoSvg, 100, 100);
      pdf.addImage(logoPng, "PNG", contentMargin, 20, 25, 25);
    } catch (error) {
      // Simple logo placeholder
      pdf.setFillColor(200, 200, 200);
      pdf.rect(contentMargin, 20, 25, 25, "F");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text("LOGO", contentMargin + 12.5, 35, { align: "center" });
    }

    // Company Header
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("TrackyFy", 55, 35);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Gym Management Solution", 55, 42);

    // Invoice Title
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("SUBSCRIPTION INVOICE", contentMargin, 65);

    // Invoice Information
    let yPos = 80;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Invoice Details:", contentMargin, yPos);

    pdf.setFont("helvetica", "normal");
    pdf.text(`Invoice #: INV-${data.subscriptionId}`, contentMargin, yPos + 8);
    pdf.text(
      `Date: ${new Date().toLocaleDateString("en-IN")}`,
      contentMargin,
      yPos + 16
    );
    pdf.text(`Payment ID: ${data.paymentId}`, contentMargin, yPos + 24);

    // Payment Method
    let paymentMethod = "Online Payment";
    if (data.isCashPayment && data.isCashApproved) {
      paymentMethod = "Cash Payment";
    } else if (data.paymentGateway.toLowerCase() === "razorpay") {
      paymentMethod = "Razorpay";
    } else if (data.paymentGateway.toLowerCase() === "stripe") {
      paymentMethod = "Stripe";
    }
    pdf.text(`Payment Method: ${paymentMethod}`, contentMargin, yPos + 32);

    // Customer Information
    pdf.setFont("helvetica", "bold");
    pdf.text("Customer Information:", 110, yPos);

    pdf.setFont("helvetica", "normal");
    pdf.text(`Name: ${data.customerName}`, 110, yPos + 8);
    pdf.text(`Email: ${data.customerEmail}`, 110, yPos + 16);
    pdf.text(`Subscription ID: ${data.subscriptionId}`, 110, yPos + 24);

    // Subscription Details Table
    yPos = 130;
    const tableWidth = maxContentWidth;

    // Table Header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(contentMargin, yPos, tableWidth, 10, "F");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Description", contentMargin + 5, yPos + 7);
    pdf.text("Period", 80, yPos + 7);
    pdf.text("Duration", 130, yPos + 7);
    pdf.text("Amount", 160, yPos + 7);

    // Table border
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.rect(contentMargin, yPos, tableWidth, 10);

    yPos += 10;

    // Subscription row
    pdf.setFont("helvetica", "normal");
    pdf.text(`${data.planName} Subscription`, contentMargin + 5, yPos + 7);
    pdf.text(`${data.startDate} - ${data.endDate}`, 80, yPos + 7);
    pdf.text(`${data.duration} days`, 130, yPos + 7);

    let rowHeight = 10;

    if (hasDiscount) {
      // Original amount
      pdf.text(
        `INR ${data.originalAmount?.toLocaleString("en-IN")}`,
        160,
        yPos + 7
      );
      pdf.rect(contentMargin, yPos, tableWidth, rowHeight);
      yPos += rowHeight;

      // Discount row
      pdf.setTextColor(200, 0, 0);
      pdf.text("Discount Applied", contentMargin + 5, yPos + 7);
      pdf.text("-", 80, yPos + 7);
      pdf.text("-", 130, yPos + 7);
      pdf.text(
        `-INR ${data.discountAmount?.toLocaleString("en-IN")}`,
        160,
        yPos + 7
      );
      pdf.rect(contentMargin, yPos, tableWidth, rowHeight);
      yPos += rowHeight;

      // Final amount row
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.text("Final Amount", contentMargin + 5, yPos + 7);
      pdf.text("", 80, yPos + 7);
      pdf.text("", 130, yPos + 7);
      pdf.text(`INR ${data.amount.toLocaleString("en-IN")}`, 160, yPos + 7);
      pdf.rect(contentMargin, yPos, tableWidth, rowHeight);
    } else {
      pdf.text(`INR ${data.amount.toLocaleString("en-IN")}`, 160, yPos + 7);
      pdf.rect(contentMargin, yPos, tableWidth, rowHeight);
    }

    // Total Amount Section
    yPos += 25;
    pdf.setFillColor(230, 240, 255);
    pdf.rect(contentMargin, yPos, tableWidth, 25, "F");
    pdf.setDrawColor(100, 150, 255);
    pdf.rect(contentMargin, yPos, tableWidth, 25);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 50, 150);
    pdf.text("TOTAL AMOUNT PAID", pageWidth / 2, yPos + 10, {
      align: "center",
    });

    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      `INR ${data.amount.toLocaleString("en-IN")}`,
      pageWidth / 2,
      yPos + 20,
      { align: "center" }
    );

    // Payment Status
    yPos += 30;
    pdf.setFillColor(230, 255, 230);
    pdf.rect(contentMargin, yPos, tableWidth, 15, "F");
    pdf.setDrawColor(0, 200, 0);
    pdf.rect(contentMargin, yPos, tableWidth, 15);

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 150, 0);
    pdf.text("✓ PAYMENT COMPLETED", pageWidth / 2, yPos + 10, {
      align: "center",
    });

    // Transaction Details
    yPos += 20;
    const transactionDetailsHeight = data.isCashPayment ? 25 : 20;
    pdf.setFillColor(250, 250, 250);
    pdf.rect(contentMargin, yPos, tableWidth, transactionDetailsHeight, "F");
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(contentMargin, yPos, tableWidth, transactionDetailsHeight);

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Transaction Details", contentMargin + 5, yPos + 8);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Purchase Date: ${data.purchaseDate}`,
      contentMargin + 5,
      yPos + 15
    );
    pdf.text(`Gateway: ${data.paymentGateway.toUpperCase()}`, 110, yPos + 15);

    if (data.isCashPayment) {
      pdf.text(
        `Cash Status: ${data.isCashApproved ? "Approved" : "Pending"}`,
        contentMargin + 5,
        yPos + 22
      );
    }

    // FIXED FOOTER - Proper positioning within border constraints
    const footerStartY = yPos + transactionDetailsHeight + 10;
    const footerHeight = 30; // Reduced height
    const maxFooterY = borderMargin + maxContentHeight - footerHeight;
    const footerY = Math.min(footerStartY, maxFooterY);

    // Footer background
    pdf.setFillColor(248, 250, 252);
    pdf.rect(contentMargin, footerY, tableWidth, footerHeight, "F");

    // Footer border
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.rect(contentMargin, footerY, tableWidth, footerHeight);

    // Decorative line at top of footer
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(2);
    pdf.line(contentMargin, footerY, contentMargin + tableWidth, footerY);

    // Thank you message
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(59, 130, 246);
    pdf.text("Thank you for choosing TrackyFy!", pageWidth / 2, footerY + 10, {
      align: "center",
    });

    // Subtitle
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      "This is a computer-generated invoice. No signature required.",
      pageWidth / 2,
      footerY + 18,
      { align: "center" }
    );

    // Support information
    pdf.setFontSize(7);
    pdf.setTextColor(75, 85, 99);
    pdf.text(
      "For support: support@trackyfy.in.net | www.trackyfy.in.net",
      pageWidth / 2,
      footerY + 25,
      { align: "center" }
    );

    // Main border - drawn last to ensure it's on top
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(1);
    pdf.rect(
      borderMargin,
      borderMargin,
      pageWidth - borderMargin * 2,
      pageHeight - borderMargin * 2
    );

    // Save the PDF
    pdf.save(`TrackyFy-Invoice-${data.subscriptionId}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF invoice");
  }
};
