import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email")
      .populate("product", "name");
    res.json({ orders });
  } catch (error) {
    console.log("Error in getOrders controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { product, user } = req.body;
    const dbProduct = await Product.findById(product._id);

    if (dbProduct.quantity === 0) {
      return res.status(500).json({
        message: "Já não tem quantidade. Por favor dê refresh na página.",
      });
    }
    // Cria a encomenda
    const newOrder = new Order({
      user: user._id,
      product: product._id,
      price: product.price,
    });
    await newOrder.save();

    // Atualiza o stock do produto
    if (dbProduct) {
      dbProduct.quantity = Math.max(0, dbProduct.quantity - 1);
      if (dbProduct.quantity === 0) {
        dbProduct.isFeatured = false;
      }
      await dbProduct.save();
    }

    // Monta o email usando SendGrid
    const msg = {
      from: process.env.SENDGRID_FROM_EMAIL, // remetente verificado no SendGrid
      to: user.email,
      subject: "Confirmação de encomenda",
      html: `
        <p>Olá colega,<br>
        Obrigado pela tua compra!</p>
        <p><b>Número da encomenda:</b> ${newOrder._id}<br>
        <b>Produto:</b> ${product.name}<br>
        <b>Descrição:</b> ${product.description}<br>
        <b>Valor:</b> ${product.price}€<br>
        <b>Local de levantamento:</b> 13.4, junto da Equipa de IT</p>
        <p>Obrigado desde já.<br><br>
        Melhores Cumprimentos | Best Regards,<br>
        _____________________________________<br>
        LGSP - IT Team <br>
        Lufthansa Ground Services Portugal - LGSP <br>
        Av. da Boavista, 1837, sala 13.4 <br>
        4100-133 Porto – Portugal <br>
        Tel: +351 964 530 986 <br>
        Email: lgsp.it@dlh.de <br>
        www.lufthansa-lgsp.com</p>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log("Email enviado com sucesso para:", user.email);
    } catch (sendError) {
      console.error("Erro ao enviar email via SendGrid:", sendError);
      // não retorna erro ao frontend
    }

    return res.status(200).json({
      message: "Compra efetuada com sucesso. Email com instruções enviado!",
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return res.status(500).json({
      message: "Erro a processar compra!",
      error: error.message,
    });
  }
};
