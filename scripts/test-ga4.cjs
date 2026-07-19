const {
    BetaAnalyticsDataClient,
  } = require("@google-analytics/data");
  
  async function testGoogleAnalytics() {
    const propertyId = process.env.GA4_PROPERTY_ID;
    const encodedCredentials =
      process.env.GOOGLE_ANALYTICS_CREDENTIALS_BASE64;
  
    if (!propertyId) {
      throw new Error(
        "GA4_PROPERTY_ID 환경변수가 없습니다."
      );
    }
  
    if (!encodedCredentials) {
      throw new Error(
        "GOOGLE_ANALYTICS_CREDENTIALS_BASE64 환경변수가 없습니다."
      );
    }
  
    let credentials;
  
    try {
      credentials = JSON.parse(
        Buffer.from(
          encodedCredentials,
          "base64"
        ).toString("utf8")
      );
    } catch {
      throw new Error(
        "Google Analytics 인증정보를 해석하지 못했습니다."
      );
    }
  
    if (
      !credentials.client_email ||
      !credentials.private_key
    ) {
      throw new Error(
        "서비스 계정 이메일 또는 비밀키가 없습니다."
      );
    }
  
    const analyticsClient =
      new BetaAnalyticsDataClient({
        projectId: credentials.project_id,
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
      });
  
    const [report] =
      await analyticsClient.runReport({
        property: `properties/${propertyId}`,
  
        dateRanges: [
          {
            startDate: "7daysAgo",
            endDate: "today",
          },
        ],
  
        dimensions: [
          {
            name: "sessionDefaultChannelGroup",
          },
        ],
  
        metrics: [
          {
            name: "sessions",
          },
        ],
  
        orderBys: [
          {
            metric: {
              metricName: "sessions",
            },
            desc: true,
          },
        ],
  
        limit: 20,
      });
  
    console.log("✅ GA4 Data API 연결 성공");
    console.log(`속성 ID: ${propertyId}`);
  
    const rows = report.rows || [];
  
    if (rows.length === 0) {
      console.log(
        "아직 처리된 방문 데이터가 없습니다."
      );
      console.log(
        "신규 GA4 속성이므로 데이터 반영 후 다시 확인하면 됩니다."
      );
      return;
    }
  
    console.log("\n최근 7일 유입 구분:");
  
    rows.forEach((row) => {
      const channel =
        row.dimensionValues?.[0]?.value ||
        "분류되지 않음";
  
      const sessions =
        row.metricValues?.[0]?.value || "0";
  
      console.log(`- ${channel}: ${sessions}회`);
    });
  }
  
  testGoogleAnalytics().catch((error) => {
    console.error("❌ GA4 Data API 연결 실패");
    console.error(error.message);
    process.exit(1);
  });