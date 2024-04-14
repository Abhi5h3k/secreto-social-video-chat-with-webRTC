$(document).ready(function () {
    $("#mySecretCode").click(function () {
        // Get the text content of the clicked paragraph
        var textToCopy = $(this).text();

        // Try copying the text using clipboard API (preferred)
        try {
            navigator.clipboard.writeText(textToCopy);
            // alert('Text copied!');
            $.notify('Secret Code copied!', "success");
        } catch (err) {
            console.error('Failed to copy using clipboard API:', err);
            $.notify('Copying functionality might\nbe limited in your browser.', "error");
            // Fallback method if clipboard API unsupported (limited functionality)
            // alert('Copying functionality might be limited in your browser.');
        }
    });

    //initialize instance
    var enjoyhint_instance = new EnjoyHint({});

    var enjoyhint_script_steps = [
        {
            'click .side_nav_btn': '☝️ Click here to open the side menu.'
        },
        {
            'click #headingOne': '🔑 Each session generates a unique secret key. Share this key with your friends to connect.',
        },
        {
            'click #headingTwo': '🔍 Enter the secret key shared by your friend here.',
        },
        {
            'click #headingThree': '💬 Once connected to your peer successfully, you can start chatting right away.',
        },
    ];


    //set script config
    enjoyhint_instance.set(enjoyhint_script_steps);

    //run Enjoyhint script
    enjoyhint_instance.run();

});