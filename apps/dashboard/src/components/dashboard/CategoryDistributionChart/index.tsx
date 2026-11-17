import type { ICategoryDistributionChartProps } from "./interface";
import {
  AccessibleTable,
  CategoryHeader,
  CategoryItem,
  CategoryLabel,
  CategoryList,
  CategoryValue,
  DistributionRoot,
  DistributionTitle,
  Fill,
  Track,
} from "./styled";
import { SensitiveValue } from "@dashboard/components/SensitiveValue";

export const CategoryDistributionChart = ({
  distribution,
  "data-testid": dataTestId,
}: ICategoryDistributionChartProps) => (
  <DistributionRoot
    data-testid={dataTestId}
    aria-labelledby="category-distribution-title"
  >
    <DistributionTitle id="category-distribution-title">
      {distribution.title}
    </DistributionTitle>

    <CategoryList aria-hidden="true">
      <CategoryItem>
        <CategoryHeader>
          <CategoryLabel>{distribution.firstCategory.label}</CategoryLabel>
          <CategoryValue>
            {distribution.firstCategory.formattedPercentage}
          </CategoryValue>
        </CategoryHeader>
        <Track>
          <Fill
            $width={distribution.firstCategory.barWidth}
            $tone={distribution.firstCategory.tone}
          />
        </Track>
      </CategoryItem>
      <CategoryItem>
        <CategoryHeader>
          <CategoryLabel>{distribution.secondCategory.label}</CategoryLabel>
          <CategoryValue>
            {distribution.secondCategory.formattedPercentage}
          </CategoryValue>
        </CategoryHeader>
        <Track>
          <Fill
            $width={distribution.secondCategory.barWidth}
            $tone={distribution.secondCategory.tone}
          />
        </Track>
      </CategoryItem>
      <CategoryItem>
        <CategoryHeader>
          <CategoryLabel>{distribution.thirdCategory.label}</CategoryLabel>
          <CategoryValue>
            {distribution.thirdCategory.formattedPercentage}
          </CategoryValue>
        </CategoryHeader>
        <Track>
          <Fill
            $width={distribution.thirdCategory.barWidth}
            $tone={distribution.thirdCategory.tone}
          />
        </Track>
      </CategoryItem>
      <CategoryItem>
        <CategoryHeader>
          <CategoryLabel>{distribution.fourthCategory.label}</CategoryLabel>
          <CategoryValue>
            {distribution.fourthCategory.formattedPercentage}
          </CategoryValue>
        </CategoryHeader>
        <Track>
          <Fill
            $width={distribution.fourthCategory.barWidth}
            $tone={distribution.fourthCategory.tone}
          />
        </Track>
      </CategoryItem>
      <CategoryItem>
        <CategoryHeader>
          <CategoryLabel>{distribution.fifthCategory.label}</CategoryLabel>
          <CategoryValue>
            {distribution.fifthCategory.formattedPercentage}
          </CategoryValue>
        </CategoryHeader>
        <Track>
          <Fill
            $width={distribution.fifthCategory.barWidth}
            $tone={distribution.fifthCategory.tone}
          />
        </Track>
      </CategoryItem>
    </CategoryList>

    <AccessibleTable>
      <caption>{distribution.accessibleDescription}</caption>
      <thead>
        <tr>
          <th scope="col">Categoria</th>
          <th scope="col">Valor</th>
          <th scope="col">Participação</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">{distribution.firstCategory.label}</th>
          <td><SensitiveValue>{distribution.firstCategory.amount.formattedValue}</SensitiveValue></td>
          <td>{distribution.firstCategory.formattedPercentage}</td>
        </tr>
        <tr>
          <th scope="row">{distribution.secondCategory.label}</th>
          <td><SensitiveValue>{distribution.secondCategory.amount.formattedValue}</SensitiveValue></td>
          <td>{distribution.secondCategory.formattedPercentage}</td>
        </tr>
        <tr>
          <th scope="row">{distribution.thirdCategory.label}</th>
          <td><SensitiveValue>{distribution.thirdCategory.amount.formattedValue}</SensitiveValue></td>
          <td>{distribution.thirdCategory.formattedPercentage}</td>
        </tr>
        <tr>
          <th scope="row">{distribution.fourthCategory.label}</th>
          <td><SensitiveValue>{distribution.fourthCategory.amount.formattedValue}</SensitiveValue></td>
          <td>{distribution.fourthCategory.formattedPercentage}</td>
        </tr>
        <tr>
          <th scope="row">{distribution.fifthCategory.label}</th>
          <td><SensitiveValue>{distribution.fifthCategory.amount.formattedValue}</SensitiveValue></td>
          <td>{distribution.fifthCategory.formattedPercentage}</td>
        </tr>
      </tbody>
    </AccessibleTable>
  </DistributionRoot>
);
