import { useState } from "react"
import { rules, useFormValidation } from "../validation/formValidation"
import "../styles/ContactPage.css"

function ContactPage() {
    const apiBaseUrl = "http://localhost:5000"

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitMessage, setSubmitMessage] = useState("")
    const [submitError, setSubmitError] = useState("")

    // ===============================
    // Validation Rules
    // ===============================
    const validationRules = {
        name: [rules.required("Name is required"), rules.minLength(3)],
        mobile: [rules.required("Mobile is required"), rules.numeric(), rules.minLength(10)],
        email: [rules.required("Email is required"), rules.email()],
        subject: [rules.required("Subject is required")],
        message: [rules.required("Message is required"), rules.minLength(10)],
    }

    const {
        values,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
        getInputClass,
        resetForm,
    } = useFormValidation({
        initialValues: {
            name: "",
            mobile: "",
            email: "",
            subject: "",
            message: "",
        },
        validationRules,
        onSubmit: async (formValues) => {
            setIsSubmitting(true)
            setSubmitMessage("")
            setSubmitError("")

            try {
                const response = await fetch(`${apiBaseUrl}/api/contact`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formValues),
                })

                const result = await response.json()

                if (!response.ok) {
                    throw new Error(result.message || "Submission failed")
                }

                setSubmitMessage("Message sent successfully!")
                resetForm()
            } catch (error) {
                setSubmitError(error.message)
            } finally {
                setIsSubmitting(false)
            }
        },
    })

    return (
        <section className="page-shell">
            <div className="row g-4">

                {/* Contact Form */}
                <div className="col-12">
                    <div className="card shadow-sm p-4 form-card">
                        <h2>Contact Us</h2>
                        <p className="page-intro">
                            Fill out the form below and our support team will get back to you shortly.
                        </p>

                        {submitMessage && <div className="alert alert-success">{submitMessage}</div>}
                        {submitError && <div className="alert alert-danger">{submitError}</div>}

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="row g-3 form-grid">

                                <div className="col-md-6">
                                    <label htmlFor="contact-name" className="form-label">Full Name</label>
                                    <input
                                        id="contact-name"
                                        type="text"
                                        name="name"
                                        placeholder="Name"
                                        className={getInputClass("name")}
                                        value={values.name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                                </div>

                                <div className="col-md-6">
                                    <label htmlFor="contact-mobile" className="form-label">Mobile Number</label>
                                    <input
                                        id="contact-mobile"
                                        type="text"
                                        name="mobile"
                                        placeholder="Mobile"
                                        className={getInputClass("mobile")}
                                        value={values.mobile}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {errors.mobile && <div className="invalid-feedback d-block">{errors.mobile}</div>}
                                </div>

                                <div className="col-12">
                                    <label htmlFor="contact-email" className="form-label">Email Address</label>
                                    <input
                                        id="contact-email"
                                        type="email"
                                        name="email"
                                        placeholder="Email"
                                        className={getInputClass("email")}
                                        value={values.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                                </div>

                                <div className="col-12">
                                    <label htmlFor="contact-subject" className="form-label">Subject</label>
                                    <input
                                        id="contact-subject"
                                        type="text"
                                        name="subject"
                                        placeholder="Subject"
                                        className={getInputClass("subject")}
                                        value={values.subject}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {errors.subject && <div className="invalid-feedback d-block">{errors.subject}</div>}
                                </div>

                                <div className="col-12">
                                    <label htmlFor="contact-message" className="form-label">Message</label>
                                    <textarea
                                        id="contact-message"
                                        name="message"
                                        rows="4"
                                        placeholder="Message"
                                        className={getInputClass("message")}
                                        value={values.message}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {errors.message && <div className="invalid-feedback d-block">{errors.message}</div>}
                                </div>

                                <div className="col-12">
                                    <button
                                        type="submit"
                                        className="btn btn-dark w-100"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Sending..." : "Send Message"}
                                    </button>
                                </div>

                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </section>
    )
}

export default ContactPage