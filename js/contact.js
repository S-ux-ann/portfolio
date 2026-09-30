/* ---------- Kontaktformular ----------
   Die Seite hat keinen Server. "Senden" prüft die Felder und öffnet dann das E-Mail-Programm
   mit einer vorausgefüllten Nachricht an Susann. */
(function(){
  const form = document.getElementById("contact-form");
  if (!form) return;
  const to = "susann.gebert@gmx.de";
  const error = form.querySelector(".ct-error");

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    const valid = name && message && form.email.checkValidity() && email;
    error.hidden = !!valid;
    form.querySelectorAll("input,textarea").forEach(f => f.setAttribute("aria-invalid", !f.value.trim() || !f.checkValidity()));
    if (!valid) return;

    const de = document.documentElement.lang === "de";
    const subject = (de ? "Kontaktanfrage über das Portfolio – " : "Portfolio contact – ") + name;
    const body = message + "\n\n" + name + "\n" + email;
    location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });
})();
