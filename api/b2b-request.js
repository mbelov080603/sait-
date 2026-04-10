const { processForm } = require("./_lib/form-service");
const { json, parseJsonBody } = require("./_lib/http");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    const result = await processForm(req, parseJsonBody(req), "b2b");
    return json(res, result.statusCode, result.payload);
  } catch (error) {
    const correlationId =
      error.correlationId ||
      `GB-API-${new Date().toISOString().replaceAll(/[-:TZ.]/g, "").slice(2, 14)}`;
    console.error("b2b-request error", {
      correlationId,
      code: error.code || "b2b_request_failed",
      message: error.message,
    });
    return json(res, error.statusCode || 500, {
      ok: false,
      error: error.code || "b2b_request_failed",
      message: error.message || "Не удалось отправить B2B-заявку.",
      correlationId,
    });
  }
};
