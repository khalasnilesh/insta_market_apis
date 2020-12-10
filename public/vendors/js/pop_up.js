/*
 * Title: Jquery PopUp Syatem
 * Author: 
 * Author URL:
 * Version: 1.0.0
 * Copyright reserve by
 */

;(function($){
    $.fn.popup = function(options){

        /*========= Defaults =========*/
        var defaults = {
            overlay:false,
            overlayColor:'rgba(0,0,0,0.8)',
            overlayClick:'close',

        };
        var options = $.extend(defaults, options);
        return this.each(function() {

            /* Variables
            ================================================== */
            var $this = $(this);
            var $popup_contener  = $('.popup_contener');
            var $pop_open  = $('.pop_open');
            var $popup_no = $popup_contener.data('popup');
            var $popup_btnNo = $pop_open.data('pop_open');
            var $close = $('.pop-close').data('pop');
            var $overlay_color = options.overlaycolor;
            var $popopen = $('a[data-pop_open]');
            
            /* Overlay 
            =================================================== */
            if(options.overlay===true){
                $this.append('<div class="overlay"></div>');
            }
            else{
                $this.children().remove('.overlay');
            }

            /* Click To Open POP Up 
            ==================================================== */
            $pop_open.click(function(){
                var thispopbtn = $(this).data('pop_open');
                var thispopup = $('.popup_contener[data-popup='+ thispopbtn +']');
                thispopup.addClass('active');
                thispopup.children('.overlay').addClass('active');
                thispopup.children('.overlay.active').css('background-color',options.overlayColor);
            });

            /* Click to Close POP UP
            ==================================================== */
            $('a[data-pop="close"]').click(function(){
                $popup_contener.removeClass('active');
                $overlay.removeClass('active');
            });
            
            var $overlay = $('.overlay');
            
            /* When Clicking on overlay and close the POP UP
            ===================================================== */
            if(options.overlayClick==="close")
            {
                $('.overlay').click(function(){
                    $(this).parent($popup_contener).removeClass('active');
                    $overlay.removeClass('active');
                });
            }

           
        });
    }

})(jQuery);