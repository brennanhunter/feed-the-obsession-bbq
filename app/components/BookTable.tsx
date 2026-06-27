"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { motion } from "framer-motion";

const reservationSchema = Yup.object({
  fullName: Yup.string()
    .required("Full name is required.")
    .min(3, "Full name must be at least 3 characters."),
  phoneNumber: Yup.string()
    .required("Phone number is required.")
    .min(10, "Phone number must be at least 10 characters."),
  email: Yup.string().required("Email is required.").email("Email is invalid."),
  persons: Yup.string().required("Persons is required."),
  date: Yup.string().required("Date is required."),
});

export default function BookTable() {
  const onSubmit = async (values: any, actions: any) => {
    // Formspree integration will go here
    console.log("Form submitted:", values);
    await new Promise((resolve) => setTimeout(resolve, 4000));
    actions.resetForm();
  };

  const { values, errors, touched, handleSubmit, handleChange, handleBlur } =
    useFormik({
      initialValues: {
        fullName: "",
        phoneNumber: "",
        email: "",
        persons: "",
        date: "",
      },
      onSubmit,
      validationSchema: reservationSchema,
    });

  const inputs = [
    {
      id: 1,
      name: "fullName",
      type: "text",
      placeholder: "Your Full Name",
      value: values.fullName,
      errorMessage: errors.fullName,
      touched: touched.fullName,
    },
    {
      id: 2,
      name: "phoneNumber",
      type: "number",
      placeholder: "Your Phone Number",
      value: values.phoneNumber,
      errorMessage: errors.phoneNumber,
      touched: touched.phoneNumber,
    },
    {
      id: 3,
      name: "email",
      type: "email",
      placeholder: "Your Email Address",
      value: values.email,
      errorMessage: errors.email,
      touched: touched.email,
    },
    {
      id: 4,
      name: "persons",
      type: "number",
      placeholder: "How Many Persons?",
      value: values.persons,
      errorMessage: errors.persons,
      touched: touched.persons,
    },
    {
      id: 5,
      name: "date",
      type: "datetime-local",
      value: values.date,
      errorMessage: errors.date,
      touched: touched.date,
    },
  ];

  return (
    <div className="bg-brand-secondary py-20">
      <div className="container mx-auto px-6">
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-[40px] font-display tracking-wider mb-10 text-center"
        >
          BOOK A TABLE
        </motion.h2>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-between flex-wrap-reverse gap-10"
        >
          <form className="lg:flex-1 w-full" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-y-3">
              {inputs.map((input) => (
                <div key={input.id} className="w-full">
                  <label className="relative block cursor-text w-full">
                    <input
                      type={input.type}
                      name={input.name}
                      value={input.value}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`h-14 w-full border outline-none px-4 peer bg-black/30 text-white
                      ${input.type !== "datetime-local" && "pt-2"}
                      ${input.touched && input.errorMessage ? "border-brand-primary" : "border-white/20"}
                      `}
                      required
                    />
                    {input.type !== "datetime-local" && (
                      <span className="absolute top-0 left-0 px-4 text-sm flex items-center h-full peer-focus:h-7 peer-focus:text-xs peer-valid:h-7 peer-valid:text-xs transition-all text-white/60">
                        {input.placeholder}
                      </span>
                    )}
                  </label>
                  {input.touched && (
                    <span className="text-xs text-brand-primary">{input.errorMessage}</span>
                  )}
                </div>
              ))}
            </div>
            <button className="btn-primary mt-4 text-white px-[30px] py-[8px] rounded-3xl bg-brand-primary cursor-pointer hover:bg-brand-primary transition-all" type="submit">
              BOOK NOW
            </button>
          </form>
          <div className="lg:flex-1 w-full">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3467.8967890123!2d-81.30519!3d29.02157!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e6d43b3b3b3b3b%3A0x1234567890abcdef!2s1750%20N%20Woodland%20Blvd%2C%20DeLand%2C%20FL%2032720!5e0!3m2!1sen!2sus!4v1733427600000"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full min-h-[400px] rounded-lg"
            ></iframe>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
