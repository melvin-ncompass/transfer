import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as fs from "fs";
import * as path from "path"; 

const SWAGGER_TAGS: Record<string, string> = {
  Auth: "Operations related to User Authentication, 2FA, and Session Management",
};
 
export function setupSwagger(app: INestApplication) {
  const builder = new DocumentBuilder()
    .setTitle("BSuite")
    .setVersion("1.0")
    .addBearerAuth()
    .addSecurity("refreshToken", {
      type: "apiKey",
      in: "cookie",
      name: "refreshToken",
      description: "The refresh token cookie",
    })
    .addSecurity("companyId", {
      type: "apiKey",
      in: "cookie",
      name: "companyId",
      description: "The company ID cookie",
    })
    .addSecurity("email", {
      type: "apiKey",
      in: "cookie",
      name: "email",
      description: "The email cookie",
    });

  Object.entries(SWAGGER_TAGS).forEach(([name, description]) => {
    builder.addTag(name, description);
  });

  const config = builder.build();
  const swaggerDocument = SwaggerModule.createDocument(app, config);

  const customCssPath = path.join(process.cwd(), "src/utils/theme.css");
  const logoPath = process.env.FAV_ICON_PATH!;

  const customCss = fs.existsSync(customCssPath)
    ? fs.readFileSync(customCssPath, "utf8")
    : "";
  let logoBase64 = "";
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  }

  SwaggerModule.setup("api", app, swaggerDocument, {
    customSiteTitle: "BSuite ",
    customfavIcon: logoBase64,
    customCss: customCss,
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
    },
  });
}
