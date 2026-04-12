# batch_design Examples

Common patterns for .pen file manipulation.

## Table of Contents
- [Dashboard Skeleton](#dashboard-skeleton)
- [Component Instance with Nested Updates](#component-instance-with-nested-updates)
- [Copy and Modify Screen](#copy-and-modify-screen)
- [AI Image Generation](#ai-image-generation)
- [Global Color Replace](#global-color-replace)
- [Card Grid Layout](#card-grid-layout)
- [Navigation Bar](#navigation-bar)
- [Form Layout](#form-layout)

## Dashboard Skeleton

```
sidebar=I("parentId", {type: "ref", ref: "SidebarCompId", x: 0, y: 0, width: 240, height: "fill_container"})
main=I("parentId", {type: "frame", name: "MainContent", layout: "vertical", gap: 24, padding: 32, width: "fill_container"})
header=I(main, {type: "frame", name: "Header", layout: "horizontal", gap: 16, height: 48})
title=I(header, {type: "text", name: "PageTitle", content: "Dashboard", fontSize: 24, fontWeight: "bold"})
statsRow=I(main, {type: "frame", name: "StatsRow", layout: "horizontal", gap: 16})
card1=I(statsRow, {type: "ref", ref: "StatCardId", width: "fill_container"})
card2=I(statsRow, {type: "ref", ref: "StatCardId", width: "fill_container"})
card3=I(statsRow, {type: "ref", ref: "StatCardId", width: "fill_container"})
```

## Component Instance with Nested Updates

```
card=I("parentId", {type: "ref", ref: "CardComponentId"})
U(card+"/titleText", {content: "Revenue"})
U(card+"/valueText", {content: "$42,500"})
U(card+"/iconFrame", {fill: "#10B981"})
```

Path navigation: use `+"/childName"` to access children within a ref instance.

## Copy and Modify Screen

```
v2=C("originalScreenId", document, {name: "Dashboard V2", positionDirection: "right", positionPadding: 100, descendants: {"sidebar": {visible: false}, "header/titleText": {content: "Dashboard V2"}}})
```

Key: Use `descendants` to modify children during copy. Do NOT use U() on copied children
(they get new IDs that you don't know).

## AI Image Generation

No `image` node type exists. Create a frame/rectangle, then fill it:

```
hero=I("parentId", {type: "frame", name: "HeroImage", width: 800, height: 400, cornerRadius: [12, 12, 12, 12]})
G(hero, "ai", "modern minimal workspace with warm lighting, professional photography")
```

For stock photos:
```
avatar=I("parentId", {type: "ellipse", name: "UserAvatar", width: 48, height: 48})
G(avatar, "stock", "professional headshot portrait")
```

## Global Color Replace

Use `replace_all_matching_properties` (separate tool, not batch_design):

```json
{
  "filePath": "design.pen",
  "parents": ["rootFrameId"],
  "properties": {
    "fillColor": [
      {"from": "#3b82f6", "to": "#8b5cf6"},
      {"from": "#EFF6FF", "to": "#F5F3FF"}
    ],
    "textColor": [
      {"from": "#1f2937", "to": "#111827"}
    ]
  }
}
```

## Card Grid Layout

```
grid=I("parentId", {type: "frame", name: "CardGrid", layout: "horizontal", gap: 16, wrap: true, width: "fill_container"})
c1=I(grid, {type: "ref", ref: "CardCompId", width: 300})
c2=I(grid, {type: "ref", ref: "CardCompId", width: 300})
c3=I(grid, {type: "ref", ref: "CardCompId", width: 300})
c4=I(grid, {type: "ref", ref: "CardCompId", width: 300})
```

## Navigation Bar

```
nav=I("parentId", {type: "frame", name: "Navbar", layout: "horizontal", gap: 0, padding: [0, 24, 0, 24], height: 64, width: "fill_container", fill: "#FFFFFF"})
logo=I(nav, {type: "frame", name: "Logo", width: 120, height: 32})
G(logo, "ai", "minimal tech company logo mark")
links=I(nav, {type: "frame", name: "NavLinks", layout: "horizontal", gap: 32, width: "fill_container", horizontalAlign: "center"})
link1=I(links, {type: "text", name: "NavHome", content: "Home", fontSize: 14, fontWeight: "medium"})
link2=I(links, {type: "text", name: "NavProducts", content: "Products", fontSize: 14})
link3=I(links, {type: "text", name: "NavAbout", content: "About", fontSize: 14})
cta=I(nav, {type: "ref", ref: "ButtonCompId"})
```

## Form Layout

```
form=I("parentId", {type: "frame", name: "LoginForm", layout: "vertical", gap: 20, padding: 32, width: 400, fill: "#FFFFFF", cornerRadius: [16, 16, 16, 16]})
title=I(form, {type: "text", name: "FormTitle", content: "Sign In", fontSize: 24, fontWeight: "bold"})
emailField=I(form, {type: "ref", ref: "InputFieldId"})
U(emailField+"/label", {content: "Email"})
U(emailField+"/placeholder", {content: "you@example.com"})
passField=I(form, {type: "ref", ref: "InputFieldId"})
U(passField+"/label", {content: "Password"})
submitBtn=I(form, {type: "ref", ref: "PrimaryButtonId"})
U(submitBtn+"/label", {content: "Sign In"})
```
