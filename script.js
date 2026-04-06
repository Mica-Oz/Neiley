$(document).ready(function () {
  // Toggle a practice dropdown only when the top card (.offerings) is clicked.
  // Clicks inside the .prac-sub panel (e.g., on sub-category links) will NOT
  // toggle the dropdown, so links remain clickable without collapsing the menu.
  $(".offerings").click(function (e) {
    // Don't toggle if the user clicked on the title link itself —
    // let the link navigate normally.
    if ($(e.target).closest("a").length) {
      return;
    }
    e.stopPropagation();
    let prac = $(this).closest(".prac");
    prac.toggleClass("expanded");
    prac.find(".prac-sub").slideToggle();
  });

  // Clicking inside the dropdown panel should not bubble up and trigger
  // the document-level "outside click" handler.
  $(".prac-sub").click(function (e) {
    e.stopPropagation();
  });

  // Clicking anywhere outside of an open .prac card closes any open dropdowns.
  $(document).click(function (e) {
    if (!$(e.target).closest(".prac").length) {
      $(".prac.expanded")
        .removeClass("expanded")
        .find(".prac-sub")
        .slideUp();
    }
  });
});
