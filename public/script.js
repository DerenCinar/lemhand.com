document.addEventListener('DOMContentLoaded', function () {

  // Get all "navbar-burger" elements
  var $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

  // Check if there are any nav burgers
  if ($navbarBurgers.length > 0) {

    // Add a click event on each of them
    $navbarBurgers.forEach(function ($el) {
      $el.addEventListener('click', function () {

        // Get the target from the "data-target" attribute
        var target = $el.dataset.target;
        var $target = document.getElementById(target);

        // Toggle the class on both the "navbar-burger" and the "navbar-menu"
        $el.classList.toggle('is-active');
        $target.classList.toggle('is-active');

      });
    });
  }

});



function myFunction() {
  var element = document.body;
  element.classList.toggle("dark-mode");
}

      const square = document.getElementById("square");
      const frontSide = document.getElementById("frontSide");
      const rightSide = document.getElementById("rightSide");
      const leftSide = document.getElementById("leftSide");

      frontSide.addEventListener("click", () => {
        frontSide.style.display = "none";
        rightSide.style.display = "block";
        leftSide.style.display = "block";
        square.style.transform = "rotate3d(0, 0, 0, 90deg)";
        document.title = "Login page";
      });

      rightSide.addEventListener("click", () => {
        rightSide.style.display = "none";
        frontSide.style.display = "block";
        leftSide.style.display = "block";
        square.style.transform = "rotate3d(0, -1, 0, 90deg)";
        document.title = "Sign up page";
      });

      leftSide.addEventListener("click", () => {
        leftSide.style.display = "none";
        frontSide.style.display = "block";
        rightSide.style.display = "none";
        square.style.transform = "rotate3d(0, 1, 0, 90deg)";
        document.title = "Forgot password page";
      });
    