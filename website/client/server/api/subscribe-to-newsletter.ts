import mailchimp from "@mailchimp/mailchimp_marketing";

async function subscribe(email: string) {
  mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER,
  });

  try {
    const response = await mailchimp.lists.addListMember(
      process.env.MAILCHIMP_LIST_ID,
      {
        email_address: email,
        status: "subscribed",
        tags: ["landing-page"],
      }
    );

    return {
      status: 200,
      response,
    };
  } catch (error) {
    return {
      status: error.status,
      message: JSON.parse(error?.response?.text)?.title,
    };
  }
}

export default defineEventHandler(async (event) => {
  const { email } = await useBody(event);
  if (!email || !email.length) {
    const response = {
      message: "Forgot to add your e-mail?",
      status: 400,
    };
    return response;
  }

  const response = await subscribe(email);

  return response;
});
