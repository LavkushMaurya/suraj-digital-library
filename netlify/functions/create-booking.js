export default async () => {

    return new Response(
        JSON.stringify({
            success: true,
            message: "Suraj Digital Library backend is working."
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
};