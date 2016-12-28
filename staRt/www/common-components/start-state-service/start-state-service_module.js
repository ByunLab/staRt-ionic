var startStateService = angular.module('startStateService', []);

startStateService.factory('StartUIState', function()
{
  return {
    getLastActiveIndex: function(lf) {
      return lf.getItem("lastActiveIndex");
      // return parseInt(window.localStorage.lastActiveIndex) || 0;
    },
    setLastActiveIndex: function(lf, index) {
      return lf.setItem("lastActiveIndex", index);
    },
    tabData: [
      {
        title: "Profiles",
        sref: "profiles",
        ani: "tada"
      },
      {
        title: "Tutorial",
        sref: "tutorial",
        ani: "rotateIn" 
      },
      {
        title: "Auto",
        sref: "auto",
        ani: "flipInX"
      },
      {
        title: "Free Play",
        sref: "free-play",
        ani: "bounce"
      },
      {
        title: "Syllables",
        sref: "syllables",
        ani: "bounceIn"
      },
      {
        title: "Words",
        sref: "words",
        ani: "bounceIn"

      },
      {
        title: "Resources",
        sref: "resources",
        ani: "flipInY"
      }
    ],
    content: [
      "A whole bunch of Profles",
      "A great big tutorial",
      "Auto, whatever that means",
      "Play around for free I guess",
      "Syl-la-bles",
      "Different words and stuff",
      "Gold, wood, stone"
    ]
  };
});