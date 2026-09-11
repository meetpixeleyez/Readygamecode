(function ($) {
  "use strict";

  // ==========================================
  //      Start Document Ready function
  // ==========================================
  $(document).ready(function () {
    // ============== Header Hide Click On Body Js Start ========
    $(".header-button").on("click", function () {
      $(".body-overlay").toggleClass("show");
    });
    $(".body-overlay").on("click", function () {
      $(".header-button").trigger("click");
      $(this).removeClass("show");
    });
    // =============== Header Hide Click On Body Js End =========

    // ========================== Header Hide Scroll Bar Js Start =====================
    $(".navbar-toggler.header-button").on("click", function () {
      $("body").toggleClass("scroll-hide-sm");
    });
    $(".body-overlay").on("click", function () {
      $("body").removeClass("scroll-hide-sm");
    });
    // ========================== Header Hide Scroll Bar Js End =====================

    // ========================== Small Device Header Menu On Click Dropdown menu collapse Stop Js Start =====================
    $(".dropdown-item").on("click", function () {
      $(this).closest(".dropdown-menu").addClass("d-block");
    });
    // ========================== Small Device Header Menu On Click Dropdown menu collapse Stop Js End =====================

    // ========================== Add Attribute For Bg Image Js Start =====================
    $(".bg-img").css("background", function () {
      var bg = "url(" + $(this).data("background-image") + ")";
      return bg;
    });
    // ========================== Add Attribute For Bg Image Js End =====================

    // ========================= Category Slider Js Start ===============

    $(".category-item-slider").slick({
      slidesToShow: 6,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 1000,
      pauseOnHover: true,
      speed: 1000,
      dots: false,
      arrows: true,
      prevArrow:
        '<button type="button" class="slick-prev"><i class="icon-Left-Arrow"></i></button>',
      nextArrow:
        '<button type="button" class="slick-next"><i class="icon-Right-Aroow"></i></button>',
      responsive: [
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 5,
          },
        },
        {
          breakpoint: 767,
          settings: {
            slidesToShow: 3,
          },
        },
        {
          breakpoint: 400,
          settings: {
            slidesToShow: 2,
          },
        },
      ],
    });

    $(
      ".browse-best-selling-slider, .weekly-best-selling-slider, .payment-method"
    ).slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 1000,
      pauseOnHover: true,
      speed: 2000,
      dots: false,
      arrows: true,
      prevArrow:
        '<button type="button" class="slick-prev"><i class="icon-Left-Arrow"></i></button>',
      nextArrow:
        '<button type="button" class="slick-next"><i class="icon-Right-Aroow"></i></button>',
      responsive: [
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 3,
          },
        },
        {
          breakpoint: 767,
          settings: {
            slidesToShow: 2,
          },
        },
        {
          breakpoint: 424,
          settings: {
            slidesToShow: 1,
          },
        },
      ],
    });
    // ========================= Brose Best Selling Product Slider Js End ===================

    // ========================= Product Sidebar Add Class on Template body Js Start ===========================
    $(".filter-btn").on("click", function () {
      $("body").toggleClass("toggle-sidebar");
      $(".product-sidebar").toggleClass("show");
      $(".sidebar-overlay").toggleClass("show");
      $("body").toggleClass("scroll-hide-sm");
    });
    $(".sidebar-overlay, .close-sidebar").on("click", function () {
      $(".sidebar-overlay").removeClass("show");
      $(".product-sidebar").removeClass("show");
      $("body").removeClass("scroll-hide-sm");
    });
    // ========================= Product Sidebar Add Class on Template body Js End ===========================

    // ========================= List View And Grid View js Start ===========================
    $(".list-view-btn").on("click", function () {
      $(".product-body").addClass("list-view");
      $(this).addClass("text--base");
      $(".grid-view-btn").removeClass("text--base");
    });
    $(".grid-view-btn").on("click", function () {
      $(".product-body").removeClass("list-view");
      $(".list-view-btn").removeClass("text--base");
      $(this).addClass("text--base");
    });
    // ========================= List View And Grid View js End ===========================

    // ========================= Product Sidebar Accordion Js Start ===========================
    $(".product-sidebar__title.has-accordion").on("click", function () {
      $(this).siblings(".product-sidebar__content").slideToggle(300);
      $(this).toggleClass("rotate");
    });
    // ========================= Product Sidebar Accordion Js End ===========================

    // ================== Password Show Hide Js Start ==========
    $(".toggle-password").on("click", function () {
      $(this).toggleClass(" fa-eye-slash");
      var input = $($(this).attr("id"));
      if (input.attr("type") == "password") {
        input.attr("type", "text");
      } else {
        input.attr("type", "password");
      }
    });
    // =============== Password Show Hide Js End =================

    // ========================== Profile Dropdown Js Start ====================
    $(".profile-info__button").on("click", function (event) {
      event.stopPropagation();
      $(".profile-dropdown").toggleClass("show");
    });
    $(".profile-dropdown").on("click", function (event) {
      event.stopPropagation();
      $(this).addClass("show");
    });
    $("body").on("click", function () {
      $(".profile-dropdown").removeClass("show");
    });
    // ========================== Profile Dropdown Js End ====================

    // ========================== add active class to ul>li top Active current page Js Start =====================
    function dynamicActiveMenuClass(selector) {
      let FileName = window.location.pathname.split("/").reverse()[0];

      selector.find("li").each(function () {
        let anchor = $(this).find("a");
        if ($(anchor).attr("href") == FileName) {
          $(this).addClass("active");
        }
      });
      // if any li has active element add class
      selector.children("li").each(function () {
        if ($(this).find(".active").length) {
          $(this).addClass("active");
        }
      });
      // if no file name return
      if ("" == FileName) {
        selector.find("li").eq(0).addClass("active");
      }
    }
    if ($("ul.custom-tab").length) {
      dynamicActiveMenuClass($("ul.custom-tab"));
    }
    // ========================== add active class to ul>li top Active current page Js End ====================

    // ========================= Tooltip Js Start ===========================
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );
    const tooltipList = [...tooltipTriggerList].map(
      (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );
    // ========================= Tooltip Js End ===========================

    // ========================= Scroll Spy Js Start ===========================
    if ($("#sidebar-scroll-spy").children().length) {
      const scrollSpy = new bootstrap.ScrollSpy(document.body, {
        target: "#sidebar-scroll-spy",
      });
    }
    // ========================= Scroll Spy Js End ===========================

    // ========================= Social Share Js Start ===========================
    $(".social-share__button").on("click", function (event) {
      event.stopPropagation();
      $(".social-share__icons").toggleClass("show");
    });

    $("body").on("click", function (event) {
      $(".social-share__icons").removeClass("show");
    });

    // For device width size js start
    // let screenSize = screen.width
    // alert(' Your Screen Size is: ' + screenSize + 'pixel');
    // For device width size js start

    let socialShareBtn = $(".social-share");
    // Check if the element exists
    if (socialShareBtn.length > 0) {
      let leftDistance = socialShareBtn.offset().left;
      let rightDistance =
        $(window).width() - (leftDistance + socialShareBtn.outerWidth());

      if (leftDistance < rightDistance) {
        $(".social-share__icons").addClass("left");
      }
    }
    // ========================= Social Share Js End ===========================

    // ========================= Text Curve Js Start ===========================
    const text = document.querySelector(".curve-text-content__text p");
    if (!text) return;
    text.innerHTML = text.innerText
      .split("")
      .map(
        (char, i) =>
          `<span style="transform:rotate(${i * 12.9}deg)">${char} </span>`
      )
      .join("");

    // ========================= Tabs active slider background animation Slider Js End ===================
  });

  // ========================= Preloader Js Start =====================
  $(window).on("load", function () {
    $(".preloader").fadeOut();
  });
  // ========================= Preloader Js End=====================

  // ========================= Header Sticky Js Start ==============
  $(window).on("scroll", function () {
    if ($(window).scrollTop() >= 300) {
      $(".header").addClass("fixed-header");
    } else {
      $(".header").removeClass("fixed-header");
    }
  });
  // ========================= Header Sticky Js End===================

  //============================ Scroll To Top Icon Js Start =========
  var btn = $(".scroll-top");

  $(window).scroll(function () {
    if ($(window).scrollTop() > 300) {
      btn.addClass("show");
    } else {
      btn.removeClass("show");
    }
  });

  btn.on("click", function (e) {
    if (e.cancelable) e.preventDefault();
    $("html, body").animate({ scrollTop: 0 }, "300");
  });
  //========================= Scroll To Top Icon Js End ======================
})(jQuery);

function incCartQty() {
  const qty = Number($(".cart-button__qty").first().text());
  const cartQtyEl = $(".cart-button__qty.flex-center");
  $(cartQtyEl).text(qty + 1);
}

function decCartQty() {
  const qty = Number($(".cart-button__qty").first().text());
  const cartQtyEl = $(".cart-button__qty.flex-center");
  $(cartQtyEl).text(qty - 1);
}

$(".nav-link").on("click", function (e) {
  if ($(e.target).hasClass("la-angle-down")) {
    if (e.cancelable) e.preventDefault();
    const dropdown = $(this).next();
    dropdown.toggleClass("show");
  }
});

function hslToHex(hsl) {
  let [h, s, l] = hsl.match(/\d+/g).map(Number);
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = l - c / 2;
  let r, g, b;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${((1 << 24) | (r << 16) | (g << 8) | b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
}

