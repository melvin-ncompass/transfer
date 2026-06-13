import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';
import { SwaggerHierarchyPlugin } from './swagger-hierarchy.plugin';

export const GlobalSwaggerTags: Record<string, string> = {
  'System': 'Core administrative and user management services.',
  'Business': 'Business intelligence, data analytics and configurations.',
  'System/Users': 'Management of system users and administrative account actions.',
  'System/Profile': 'Personal user settings and account-specific metadata.',
  'System/Roles': 'Handling of RBAC (Role-Based Access Control) management and permission assignments.',
  'System/Invites': 'Handling of user invitations.',
  'System/Settings': 'Handling of application configurations.',
  'System/Auth': 'Secure login, registration, and session handling',
  'System/Sessions': 'Management of active user sessions and device tracking.',
  'System/Sign Up Request':
    'Workflow for users requesting to register, pending registrations and approval queues.',
  'Business/Dashboard':
    'Visualized insights and overview of climate and health metrics.',
  'Business/Config': 'Business-level settings parameters.',
  'Business/Data':
    'Endpoints for climate and health data filtered by location and data range ',
  'Business/Dashboard/Forecast': 'Predictive analytics of climate and health',
  'Business/Dashboard/Overview': 'Overview of the climate and health data',
  'Business/Dashboard/Prompts':
    'Trend data for prompt intents, aggregated over time and filtered by location',
  'Business/Dashboard/Climate': 'Monthly climate data.',
  'Not Integrated': 'Endpoints not integrated with frontend',
};



const config = new DocumentBuilder()
  .setTitle('CxH Pulse API')
  .setDescription(
    `CxH Pulse brings together climate, health, and facility data to enable proactive decision-making and targeted interventions`,
  )
  .setVersion('1.0')
  .addBearerAuth();

Object.entries(GlobalSwaggerTags).forEach(([name, description]) => {
  const isParentFolder = Object.keys(GlobalSwaggerTags).some(key => key.startsWith(name + '/'));
  if (!isParentFolder) {
    config.addTag(name, description);
  }
});

export const CustomFilterPlugin = () => {
  return {
    fn: {
      opsFilter: (taggedOps, phrase) => {
        const term = phrase.toLowerCase();

        return taggedOps
          .mapEntries(([tag, tagObj]) => {
            const tagMatches = tag.toLowerCase().includes(term);

            const filteredOps = tagObj.get('operations').filter((op) => {
              const path = (op.get('path') || '').toLowerCase();
              const summary = (op.getIn(['operation', 'summary']) || '').toLowerCase();
              const opId = (op.getIn(['operation', 'operationId']) || '').toLowerCase();
              const description = (op.getIn(['operation', 'description']) || '').toLowerCase();

              const endpointMatches = 
                tagMatches ||
                path.includes(term) ||
                summary.includes(term) ||
                opId.includes(term) ||
                description.includes(term);


              return endpointMatches;
            });


            if (filteredOps.size > 0) {
              return [tag, tagObj.set('operations', filteredOps)];
            }

            return undefined;
          })
          .filter(Boolean);
      },
    },
  };
};

export const customSwaggerCustomOptions = (branding: {
  fontColor: string;
  bgColor: string;
  logo?: string;
}): SwaggerCustomOptions => ({
  swaggerOptions: {
    docExpansion:0,
    defaultModelsExpandDepth: -1,
    filter: true,
    filterPlaceholder: 'Search endpoints, tags, or IDs…',
    plugins: [CustomFilterPlugin],
  },
  customJsStr: SwaggerHierarchyPlugin.getHierarchyScript(GlobalSwaggerTags),
  customSiteTitle: 'CxH Pulse',
  customfavIcon: '/api/static/favicon.ico',
  customCss: `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&family=Barlow:wght@400;700&display=swap');
    .swagger-ui {
      font-family: 'DM Sans', 'Barlow', sans-serif !important;
    }
    .swagger-ui * {
      font-family: 'DM Sans', 'Barlow', sans-serif !important;
    }

    .swagger-ui .info .title {
      font-family: 'DM Sans', 'Barlow', sans-serif !important;
      font-size: 2em !important;
      font-weight: 700 !important;
      color: ${branding.fontColor} !important;
    }
    .swagger-ui .info p {
      font-family: 'DM Sans', 'Barlow', sans-serif !important;
      font-size: 1em !important;
      line-height: 1.5 !important;
      color: ${branding.fontColor} !important;
    }

.swagger-ui .topbar {
  background-color: ${branding.bgColor} !important;
  padding: 12px 0 !important;
}

.swagger-ui .topbar-wrapper {
  display: flex !important;
  align-items: center !important;
}


.swagger-ui .topbar-wrapper .link {
  display: flex !important;
  align-items: center !important;
  min-width: 220px !important;
  min-height: 40px !important;
  position: relative !important;
}

.swagger-ui .topbar-wrapper .link svg,
.swagger-ui .topbar-wrapper .link img,
.swagger-ui .topbar-wrapper .link span {
  display: none !important;
}


.swagger-ui .topbar-wrapper .link::after {
  content: '';
  display: block;
  width: 220px;
  height: 34px;

  background-color: ${branding.fontColor};

  
  -webkit-mask-image: url('/api/static/logo.svg');
  mask-image: url('/api/static/logo.svg');

  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  -webkit-mask-position: left center;
  mask-position: left center;

  -webkit-mask-size: contain;
  mask-size: contain;
  }
    .swagger-ui .opblock-tag {
      position: relative ;
      display: flex ;
      flex-direction: column ;
      align-items: flex-start ;
      padding: 15px 50px 15px 20px t;
    }
    .swagger-ui .folder-header,
    .swagger-ui .folder-header .folder-title,
    .swagger-ui .folder-header div {
        color: ${branding.fontColor} !important;
    }

    .swagger-ui .sub-folder-header {
      padding: 10px 10px 10px 40px !important;
      cursor: pointer;
      display: flex;
      align-items: center;
      position: relative;
    }
    
    .swagger-ui .sub-folder-header .folder-title {
       font-size: 24px !important;
       color: ${branding.fontColor} !important;
       font-weight: 600 !important;
       margin-left: 10px;
    }

    .swagger-ui h3.opblock-tag[data-tag],
    .swagger-ui h3.opblock-tag[data-tag] span,
    .swagger-ui h3.opblock-tag[data-tag] a {
        color: ${branding.fontColor} !important;
    }

    /* Sub-tags (Indented) Styling Override - High Specificity */
    .swagger-ui .opblock-tag-section.hierarchy-indented h3.opblock-tag,
    .swagger-ui .opblock-tag-section.hierarchy-indented h3.opblock-tag span,
    .swagger-ui .opblock-tag-section.hierarchy-indented h3.opblock-tag a {
        color: ${branding.fontColor} !important; 
        font-size: 24px !important;
    }
    
    .swagger-ui .hierarchy-indented {
        border-left: 2px solid rgba(59, 65, 81, 0.1);
        margin-left: 20px;
    }

    /* Robust Indentation using Data Attributes to prevent jumps */
    .swagger-ui .opblock-tag-section[data-level="1"] > .opblock-tag {
        padding-left: 40px !important;
    }
    .swagger-ui .opblock-tag-section[data-level="2"] > .opblock-tag {
        padding-left: 60px !important;
    }

    .swagger-ui .opblock-tag small {
      margin-left: 0 ;
      padding-top: 8px;
      font-size: 14px;
      color: #555;
      display: block;
      line-height: 1.5;
    }
    .swagger-ui .opblock-tag .expand-operation,
    .swagger-ui .opblock-tag button.expand-operation {
      position: absolute ;
      right: 15px ;
      top: 15px ;
      display: flex ;
      background: transparent ;
      border: none ;
    }

    .swagger-ui .opblock-tag .expand-operation svg {
      fill: #3b4151 ;
      width: 24px ;
      height: 24px ;
      display: block ;
      visibility: visible ;
    }
    .swagger-ui .btn.authorize {
    background-color: ${branding.fontColor} !important;
    border-color:${branding.fontColor} !important;     
    color: white !important;              
    }
    .swagger-ui .btn.authorize:hover {
      background-color: #ff4545 !important; 
      border-color: #ff4545 !important;
    }

    .swagger-ui .token-source {
      background-color: ${branding.fontColor} !important; 
      color: white !important;
    }
    .swagger-ui .btn.authorize svg {
      fill: white !important; 
    }
    .folder-header,
.swagger-ui .opblock-tag {
  padding: 15px 60px 15px 20px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  justify-content: center !important;
  position: relative !important;
  border-bottom: 1px solid rgba(59, 65, 81, 0.15) !important;
  cursor: pointer !important;
  min-height: 80px !important;
}

.folder-title,
.swagger-ui .opblock-tag a span {
  font-weight: bold !important;
  font-size: 24px !important;
  color: #3b4151 !important;
  display: block !important;
  margin: 0 !important;
}

.folder-description,
.swagger-ui .opblock-tag small {
  font-size: 14px !important;
  color: #626262 !important;
  display: block !important;
  padding-top: 5px !important;
  margin: 0 !important;
  white-space: normal !important;
  flex: none !important;
}

.folder-arrow,
.swagger-ui .opblock-tag button,
.swagger-ui .opblock-tag span:has(svg) {
  position: absolute !important;
  right: 20px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 24px !important;
  height: 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important;
  padding: 0 !important;
  background: none !important;
  border: none !important;
}

.swagger-ui .opblock-tag svg,
.swagger-ui .opblock-tag button svg,
.swagger-ui .opblock-tag span svg {
  width: 20px !important;
  height: 20px !important;
  fill: #3b4151 !important;
  transition: transform 0.2s ease-in-out !important;

  /* transform: rotate(0deg) !important;  */
  position: static !important;
}

.folder-arrow svg {
  width: 20px !important;
  height: 20px !important;
  fill: #3b4151 !important;
  transform: rotate(90deg) !important; 
  position: static !important; 

}

.nav-folder.is-open > .folder-header .folder-arrow svg {
  transform: rotate(0deg) !important; 
}

.swagger-ui .opblock-tag-section.is-open .opblock-tag svg,
.swagger-ui .opblock-tag-section.is-open .opblock-tag button svg,
.swagger-ui .opblock-tag-section.is-open .opblock-tag span svg {
  transform: rotate(90deg) !important;
}

.swagger-ui .opblock-tag a {
  padding: 0 !important;
  margin: 0 !important;
  display: block !important;
}

.folder-content {
  display: none;
  padding-left: 20px;
  border-left: 2px solid rgba(59, 65, 81, 0.1);
  margin-left: 20px;
}

.nav-folder.is-open > .folder-content {
  display: block;
}
  `,
});

export const swaggerConfig = config.build();
