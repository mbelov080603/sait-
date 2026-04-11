const { resolveDistanceFromMoscow } = require("./_lib/geocode");

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const getAddressValue = (req) => {
  if (req.method === "GET") {
    try {
      const url = new URL(req.url, "http://localhost");
      return url.searchParams.get("address") || "";
    } catch {
      return "";
    }
  }

  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body.address || "";
  }

  return "";
};

module.exports = async (req, res) => {
  if (!["GET", "POST"].includes(req.method)) {
    return json(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const address = String(getAddressValue(req) || "").trim();
  if (address.length < 3) {
    return json(res, 422, {
      ok: false,
      error: "address_required",
      message: "Введите адрес доставки, чтобы определить расстояние.",
    });
  }

  try {
    const result = await resolveDistanceFromMoscow(address);
    if (!result) {
      return json(res, 422, {
        ok: false,
        error: "address_required",
        message: "Введите адрес доставки, чтобы определить расстояние.",
      });
    }

    return json(res, 200, {
      ok: true,
      distanceKm: result.distanceKm,
      displayName: result.displayName,
    });
  } catch (error) {
    console.error("distance-from-moscow error", error);
    return json(res, 502, {
      ok: false,
      error: "geocode_failed",
      message: "Не удалось определить расстояние автоматически. Менеджер уточнит его вручную.",
    });
  }
};
