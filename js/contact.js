/* ---------- Kontaktformular (Formspark) ----------
   Prüft die Felder und schickt die Nachricht im Hintergrund an Formspark.
   Danach erscheint eine Bestätigung bzw. ein Fehlerhinweis unter dem Button. */
(function(){
  const form = document.getElementById("contact-form");
  if (!form) return;
  const error = form.querySelector(".ct-error");
  const button = form.querySelector(".ct-send");
  const show = state => form.querySelectorAll(".ct-status-msg").forEach(m => { m.hidden = m.dataset.state !== state; });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const fields = [form.name, form.email, form.message];
    fields.forEach(f => f.setAttribute("aria-invalid", !f.value.trim() || !f.checkValidity()));
    const valid = fields.every(f => f.value.trim() && f.checkValidity());
    error.hidden = valid;
    show(null);
    if (!valid) { fields.find(f => f.getAttribute("aria-invalid") === "true").focus(); return; }

    const data = { name: form.name.value.trim(), email: form.email.value.trim(), message: form.message.value.trim() };
    if (form._honeypot.checked) data._honeypot = true;   // Bot → Formspark verwirft die Einsendung

    button.disabled = true;
    show("sending");
    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      fields.forEach(f => f.removeAttribute("aria-invalid"));
      show("success");
    } catch (err) {
      show("failed");
    } finally {
      button.disabled = false;
    }
  });
})();
