import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("*", "routes/$.tsx"),
  route("about", "routes/about.tsx"),
  route("contact", "routes/contact.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  // Auth callback routes
  route("instagram-callback", "routes/auth/instagram/callback.tsx"),
  //Nested routes
  route("", "routes/app/app.tsx", [
    route("explore", "routes/app/explore.tsx"),
    route("creator", "routes/app/creator.tsx"),
    route("battles", "routes/app/battles.tsx"),
    route("rewards", "routes/app/rewards.tsx"),
    route("insights", "routes/app/insights.tsx"),
    route("settings", "routes/app/settings.tsx"),
    route("launch", "routes/app/launch.tsx"),
    route("explore/search", "routes/app/search.tsx"),

    //dynamic routes with loaders
    route("explore/meme/:memeId", "routes/app/meme.tsx"),
    route("explore/meme/:memeId/mint", "routes/app/mint.tsx"),

    //claim unclaimed token route
    route("claim-token/:memeId", "routes/app/claim-token.tsx"),

    //admin routes
    route(
      "admin/create-unclaimed-token",
      "routes/admin/create-unclaimed-token.tsx"
    ),
  ]),
] satisfies RouteConfig;
